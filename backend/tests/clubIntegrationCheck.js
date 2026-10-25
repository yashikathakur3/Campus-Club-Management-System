const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const Club = require('../models/Club');
const ClubMembership = require('../models/ClubMembership');
const { signAccessToken } = require('../utils/token');
const { recountMembers } = require('../services/clubService');

async function main() {
  const mongo = await MongoMemoryServer.create({ instance: { dbName: 'campus_club_phase5_test' } });
  try {
    await mongoose.connect(mongo.getUri('campus_club_phase5_test'));
    await Promise.all([User.init(), Club.init(), ClubMembership.init()]);
    const passwordHash = await bcrypt.hash('Phase5Password123', 4);
    const [admin, presidentA, presidentB, member, concurrentMember, presidentOther] = await Promise.all([
      User.create({ name: 'Platform Admin', email: 'p5-admin@test.invalid', passwordHash, role: 'super_admin' }),
      User.create({ name: 'President Alpha', email: 'p5-alpha@test.invalid', passwordHash }),
      User.create({ name: 'President Beta', email: 'p5-beta@test.invalid', passwordHash }),
      User.create({ name: 'Club Member', email: 'p5-member@test.invalid', passwordHash }),
      User.create({ name: 'Concurrent Member', email: 'p5-concurrent@test.invalid', passwordHash }),
      User.create({ name: 'Other President', email: 'p5-other@test.invalid', passwordHash }),
    ]);
    const token = (user) => signAccessToken(user);
    const adminToken = token(admin); const memberToken = token(member); const presidentAToken = token(presidentA); const presidentBToken = token(presidentB);
    const auth = (value) => ({ Authorization: `Bearer ${value}` });
    const create = (name, presidentUserId, joinPolicy = 'approval', category = 'technical') => request(app).post('/api/v1/clubs').set(auth(adminToken)).send({ name, category, joinPolicy, presidentUserId: String(presidentUserId) });

    await create('Member Forbidden Club', presidentA._id).set(auth(memberToken)).expect(403);
    await create('President Forbidden Club', presidentA._id).set(auth(presidentAToken)).expect(403);
    let response = await create('Open Makers', presidentA._id, 'open').expect(201);
    const openClub = response.body.data.club;
    assert.equal(openClub.memberCount, 1);
    await create('open makers', presidentB._id, 'approval').expect(409);
    response = await create('Quiet Readers', presidentB._id, 'approval', 'academic').expect(201);
    const approvalClub = response.body.data.club;

    response = await request(app).post(`/api/v1/clubs/${openClub.slug}/join`).set(auth(memberToken)).send({ message: 'Hello' }).expect(201);
    assert.equal(response.body.data.membership.status, 'active');
    await request(app).post(`/api/v1/clubs/${openClub.slug}/join`).set(auth(memberToken)).send({}).expect(409);
    assert.equal(await ClubMembership.countDocuments({ club: openClub._id, user: member._id }), 1);
    let club = await Club.findById(openClub._id); assert.equal(club.memberCount, 2);

    const concurrent = await Promise.all([
      request(app).post(`/api/v1/clubs/${openClub.slug}/join`).set(auth(concurrentMember ? token(concurrentMember) : '')).send({}),
      request(app).post(`/api/v1/clubs/${openClub.slug}/join`).set(auth(token(concurrentMember))).send({}),
    ]);
    assert.deepEqual(concurrent.map((item) => item.status).sort(), [201, 409]);
    assert.equal(await ClubMembership.countDocuments({ club: openClub._id, user: concurrentMember._id }), 1);
    club = await Club.findById(openClub._id); assert.equal(club.memberCount, 3);

    response = await request(app).post(`/api/v1/clubs/${approvalClub.slug}/join`).set(auth(memberToken)).send({ message: 'Please consider me' }).expect(201);
    assert.equal(response.body.data.membership.status, 'pending');
    club = await Club.findById(approvalClub._id); assert.equal(club.memberCount, 1);
    await request(app).post(`/api/v1/clubs/${approvalClub.slug}/join`).set(auth(memberToken)).send({}).expect(409);
    const approved = await request(app).patch(`/api/v1/clubs/${approvalClub.slug}/members/${member._id}`).set(auth(presidentBToken)).send({ status: 'active' }).expect(200);
    assert.equal(approved.body.data.membership.status, 'active');
    await request(app).patch(`/api/v1/clubs/${approvalClub.slug}/members/${member._id}`).set(auth(presidentBToken)).send({ status: 'active' }).expect(409);
    club = await Club.findById(approvalClub._id); assert.equal(club.memberCount, 2);

    const soonInactive = await User.create({ name: 'Inactive Applicant', email: 'p5-inactive@test.invalid', passwordHash });
    const inactiveToken = token(soonInactive);
    await request(app).post(`/api/v1/clubs/${approvalClub.slug}/join`).set(auth(inactiveToken)).send({}).expect(201);
    await User.updateOne({ _id: soonInactive._id }, { $set: { isActive: false } });
    await request(app).patch(`/api/v1/clubs/${approvalClub.slug}/members/${soonInactive._id}`).set(auth(presidentBToken)).send({ status: 'active' }).expect(409);
    response = await request(app).get(`/api/v1/clubs/${approvalClub.slug}/members?status=pending`).set(auth(presidentBToken)).expect(200);
    assert.equal(response.body.meta.total, 0);
    assert.equal(response.body.data.some((entry) => String(entry.user._id) === String(soonInactive._id)), false);
    await request(app).patch(`/api/v1/clubs/${approvalClub.slug}/status`).set(auth(adminToken)).send({ isActive: false }).expect(200);
    await request(app).post(`/api/v1/clubs/${approvalClub.slug}/join`).set(auth(token(presidentOther))).send({}).expect(409);
    await request(app).patch(`/api/v1/clubs/${approvalClub.slug}/status`).set(auth(adminToken)).send({ isActive: true }).expect(200);

    await request(app).post(`/api/v1/clubs/${openClub.slug}/leave`).set(auth(presidentAToken)).expect(409);
    await request(app).patch(`/api/v1/clubs/${openClub.slug}/members/${member._id}`).set(auth(memberToken)).send({ status: 'removed' }).expect(403);
    await request(app).patch(`/api/v1/clubs/${approvalClub.slug}/members/${presidentOther._id}`).set(auth(presidentAToken)).send({ status: 'removed' }).expect(403);
    await request(app).patch(`/api/v1/clubs/${openClub.slug}/members/${member._id}`).set(auth(presidentAToken)).send({ clubRole: 'coordinator', canAnnounce: true }).expect(200);

    await request(app).post(`/api/v1/clubs/${openClub.slug}/transfer-presidency`).set(auth(presidentAToken)).send({ userId: String(member._id) }).expect(200);
    assert.equal((await ClubMembership.findOne({ club: openClub._id, user: member._id })).clubRole, 'president');
    assert.equal((await ClubMembership.findOne({ club: openClub._id, user: presidentA._id })).clubRole, 'coordinator');
    const transferredToken = token(member);
    await request(app).post(`/api/v1/clubs/${openClub.slug}/leave`).set(auth(transferredToken)).expect(409);

    await request(app).post(`/api/v1/clubs/${openClub.slug}/leave`).set(auth(token(presidentA))).expect(200);
    club = await Club.findById(openClub._id); assert.equal(club.memberCount, 2);
    await request(app).post(`/api/v1/clubs/${openClub.slug}/join`).set(auth(token(presidentA))).send({}).expect(201);
    assert.equal(await ClubMembership.countDocuments({ club: openClub._id, user: presidentA._id }), 1);
    assert.equal(await recountMembers(openClub._id), 3);
    club = await Club.findById(openClub._id); assert.equal(club.memberCount, 3);

    response = await request(app).get('/api/v1/auth/me').set(auth(token(presidentA))).expect(200);
    assert(response.body.data.memberships.some((entry) => entry.club.slug === openClub.slug && entry.status === 'active'));
    response = await request(app).get('/api/v1/me/memberships').set(auth(token(presidentA))).expect(200);
    assert(response.body.data.some((entry) => entry.club.slug === openClub.slug));

    response = await request(app).get('/api/v1/clubs?page=1&limit=1&category=academic&sort=name').expect(200);
    assert.equal(response.body.data.length, 1); assert.equal(response.body.data[0].slug, approvalClub.slug);
    response = await request(app).get('/api/v1/clubs?q=Open%20Makers&category=technical').expect(200);
    assert.equal(response.body.data.length, 1); assert.equal(response.body.data[0].slug, openClub.slug);
    response = await request(app).get(`/api/v1/clubs/${openClub.slug}`).expect(200);
    assert.equal(response.body.data.membersPreview, undefined, 'guests do not receive member profiles');
    response = await request(app).get(`/api/v1/clubs/${openClub.slug}`).set(auth(token(presidentA))).expect(200);
    assert(Array.isArray(response.body.data.membersPreview));
    await request(app).get('/api/v1/clubs/invalid!slug').expect(400);
    await request(app).get(`/api/v1/clubs/${new mongoose.Types.ObjectId()}`).expect(404);

    await request(app).patch(`/api/v1/clubs/${openClub.slug}/members/${concurrentMember._id}`).set(auth(presidentBToken)).send({ status: 'removed' }).expect(403);
    console.log('Club integration checks passed');
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
}

main().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
