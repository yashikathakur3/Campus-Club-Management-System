const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const { seedAdmin } = require('../scripts/seedAdmin');
const { signAccessToken } = require('../utils/token');
const clubAccessService = require('../services/clubAccessService');
const userService = require('../services/userService');

function assertNoSecrets(value) {
  if (!value || typeof value !== 'object') return;
  assert.equal(Object.hasOwn(value, 'passwordHash'), false, 'response must not expose passwordHash');
  assert.equal(Object.hasOwn(value, 'tokenVersion'), false, 'response must not expose tokenVersion');
  for (const nested of Object.values(value)) assertNoSecrets(nested);
}

async function main() {
  const mongo = await MongoMemoryServer.create({ instance: { dbName: 'campus_club_auth_test' } });
  try {
    await mongoose.connect(mongo.getUri('campus_club_auth_test'));
    await User.init();

    const baseUser = {
      name: 'Test Member',
      email: 'member@example.test',
      password: 'InitialPass123',
      studentId: 'TEST-001',
      department: 'Computer Science',
    };

    let response = await request(app).post('/api/v1/auth/register')
      .send({ ...baseUser, role: 'super_admin' }).expect(400);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
    assert.equal(await User.countDocuments(), 0, 'strict registration must reject a role field');

    response = await request(app).post('/api/v1/auth/register').send(baseUser).expect(201);
    assert.equal(typeof response.body.data.token, 'string');
    assert.equal(response.body.data.user.role, 'member');
    assertNoSecrets(response.body);
    const firstToken = response.body.data.token;

    const stored = await User.findOne({ email: baseUser.email }).select('+passwordHash');
    assert.equal(stored.role, 'member');
    assert.notEqual(stored.passwordHash, baseUser.password);
    assert.match(stored.passwordHash, /^\$2[aby]\$12\$/);
    assert.equal(await bcrypt.compare(baseUser.password, stored.passwordHash), true);

    response = await request(app).post('/api/v1/auth/register').send(baseUser).expect(409);
    assert.equal(response.body.error.code, 'CONFLICT');
    assert(response.body.error.details.some((detail) => detail.field === 'email'));

    response = await request(app).post('/api/v1/auth/register')
      .send({ ...baseUser, email: 'bad-email', password: 'short' }).expect(400);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
    assert(response.body.error.details.some((detail) => detail.field === 'email'));
    assert(response.body.error.details.some((detail) => detail.field === 'password'));

    const validLogin = await request(app).post('/api/v1/auth/login')
      .send({ email: baseUser.email, password: baseUser.password }).expect(200);
    assert.equal(typeof validLogin.body.data.token, 'string');
    assertNoSecrets(validLogin.body);

    const wrongPassword = await request(app).post('/api/v1/auth/login')
      .send({ email: baseUser.email, password: 'WrongPass123' }).expect(401);
    const unknownEmail = await request(app).post('/api/v1/auth/login')
      .send({ email: 'unknown@example.test', password: 'WrongPass123' }).expect(401);
    assert.equal(wrongPassword.body.error.message, unknownEmail.body.error.message);

    const inactiveHash = await bcrypt.hash('InactivePass123', 12);
    await User.create({ name: 'Inactive Member', email: 'inactive@example.test', passwordHash: inactiveHash, isActive: false });
    response = await request(app).post('/api/v1/auth/login')
      .send({ email: 'inactive@example.test', password: 'InactivePass123' }).expect(403);
    assert.equal(response.body.error.code, 'ACCOUNT_DISABLED');
    const inactiveUser = await User.findOne({ email: 'inactive@example.test' });
    await request(app).get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${signAccessToken(inactiveUser)}`).expect(403);

    response = await request(app).get('/api/v1/auth/me').expect(401);
    assert.equal(response.body.error.code, 'UNAUTHENTICATED');
    await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer malformed.token.value').expect(401);

    response = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${firstToken}`).expect(200);
    assert.deepEqual(response.body.data.memberships, []);
    assert.equal(response.body.data.user.email, baseUser.email);
    assertNoSecrets(response.body);

    response = await request(app).patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${firstToken}`).send({ name: 'Changed Name', role: 'super_admin' }).expect(400);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
    await request(app).patch('/api/v1/auth/me').set('Authorization', `Bearer ${firstToken}`)
      .send({ isActive: false }).expect(400);
    await request(app).patch('/api/v1/auth/me').set('Authorization', `Bearer ${firstToken}`)
      .send({ email: 'changed@example.test' }).expect(400);
    const profile = await request(app).patch('/api/v1/auth/me').set('Authorization', `Bearer ${firstToken}`)
      .send({ name: 'Updated Member', bio: 'Updated profile' }).expect(200);
    assert.equal(profile.body.data.user.name, 'Updated Member');
    assertNoSecrets(profile.body);

    const changed = await request(app).patch('/api/v1/auth/me/password')
      .set('Authorization', `Bearer ${firstToken}`)
      .send({ currentPassword: baseUser.password, newPassword: 'SecondPass456' }).expect(200);
    assert.equal(typeof changed.body.data.token, 'string');
    assertNoSecrets(changed.body);
    await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${firstToken}`).expect(401);
    await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${changed.body.data.token}`).expect(200);

    const seedInput = { email: 'seeded-admin@example.test', password: 'StrongAdminPass2026!' };
    await assert.rejects(seedAdmin({ email: seedInput.email, password: 'weak' }), /at least 16 characters/);
    const firstSeed = await seedAdmin(seedInput);
    const secondSeed = await seedAdmin(seedInput);
    assert.equal(firstSeed.created, true);
    assert.equal(secondSeed.created, false);
    assert.equal(await User.countDocuments({ email: seedInput.email, role: 'super_admin' }), 1);
    const admin = await User.findOne({ email: seedInput.email }).select('+passwordHash');
    assert.equal(await bcrypt.compare(seedInput.password, admin.passwordHash), true);
    assertNoSecrets(admin.toJSON());

    assert.equal(await clubAccessService.assertClubRole(admin, new mongoose.Types.ObjectId(), ['president']), null);
    const adminToken = signAccessToken(admin);
    const currentMember = await User.findById(stored.id);
    const memberToken = signAccessToken(currentMember);
    for (const route of ['/api/v1/users', `/api/v1/users/${stored.id}`, `/api/v1/users/${stored.id}`]) {
      const method = route.endsWith(stored.id) && route !== '/api/v1/users' ? 'patch' : 'get';
      const anonymous = request(app)[method](route);
      if (method === 'patch') anonymous.send({ isActive: false });
      await anonymous.expect(401);
      const forbidden = request(app)[method](route).set('Authorization', `Bearer ${memberToken}`);
      if (method === 'patch') forbidden.send({ isActive: false });
      await forbidden.expect(403);
    }
    response = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${adminToken}`).expect(200);
    assert.equal(response.body.meta.limit, 20);
    assert(response.body.meta.total >= 3);
    response = await request(app).get('/api/v1/users?page=1&limit=1&role=member&isActive=true&sort=name&order=asc')
      .set('Authorization', `Bearer ${adminToken}`).expect(200);
    assert.equal(response.body.data.length, 1);
    assert.equal(response.body.meta.limit, 1);
    response = await request(app).get('/api/v1/users?q=%5B.*%5D')
      .set('Authorization', `Bearer ${adminToken}`).expect(200);
    assert.equal(response.body.data.length, 0, 'search input is treated literally, not as a regex');
    await request(app).get('/api/v1/users/not-an-object-id').set('Authorization', `Bearer ${adminToken}`).expect(400);
    await request(app).patch(`/api/v1/users/${admin.id}`).set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'member' }).expect(400);
    await request(app).patch(`/api/v1/users/${admin.id}`).set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Unknown' }).expect(400);
    await request(app).patch(`/api/v1/users/${admin.id}`).set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'member' }).expect(400);
    await assert.rejects(userService.updateUser(new mongoose.Types.ObjectId(), admin.id, { role: 'member' }),
      (error) => error.code === 'LAST_SUPER_ADMIN');

    const secondAdmin = await User.create({ name: 'Second Admin', email: 'second-admin@example.test', passwordHash: await bcrypt.hash('AnotherPass123', 12), role: 'super_admin' });
    const target = await User.create({ name: 'Searchable Person', email: 'searchable@example.test', studentId: 'Q-777', passwordHash: await bcrypt.hash('TargetPass123', 12) });
    const oldTargetToken = signAccessToken(target);
    response = await request(app).patch(`/api/v1/users/${target.id}`).set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'super_admin' }).expect(200);
    assert.equal(response.body.data.user.role, 'super_admin');
    await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${oldTargetToken}`).expect(401);
    response = await request(app).get('/api/v1/users?q=Q-777&role=super_admin')
      .set('Authorization', `Bearer ${adminToken}`).expect(200);
    assert.equal(response.body.data.length, 1);
    await request(app).patch(`/api/v1/users/${secondAdmin.id}`).set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false }).expect(200);
    await request(app).patch(`/api/v1/users/${admin.id}`).set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'member' }).expect(400);

    console.log('Authentication integration checks passed');
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
