const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Club = require('../models/Club');
const ClubMembership = require('../models/ClubMembership');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const { BCRYPT_ROUNDS } = require('../services/authService');
const { validateEnv } = require('../config/env');
const connectDB = require('../config/db');

const credentialsPath = path.resolve(__dirname, '../.env.demo.local');
const usersToSeed = [
  { key: 'admin', email: 'demo.admin@campus.test', name: 'Demo Platform Admin', role: 'super_admin' },
  { key: 'roboticsPresident', email: 'demo.robotics.president@campus.test', name: 'Aarav Sharma', role: 'member', studentId: 'DEMO-1001', department: 'Computer Science' },
  { key: 'roboticsCoordinator', email: 'demo.robotics.coordinator@campus.test', name: 'Mira Patel', role: 'member', studentId: 'DEMO-1002', department: 'Electronics' },
  { key: 'studentA', email: 'demo.student.a@campus.test', name: 'Riya Verma', role: 'member', studentId: 'DEMO-1003', department: 'Computer Science' },
  { key: 'studentB', email: 'demo.student.b@campus.test', name: 'Kabir Singh', role: 'member', studentId: 'DEMO-1004', department: 'Mechanical Engineering' },
  { key: 'photographyPresident', email: 'demo.photography.president@campus.test', name: 'Ananya Rao', role: 'member', studentId: 'DEMO-1005', department: 'Visual Arts' },
  { key: 'dataPresident', email: 'demo.data.president@campus.test', name: 'Dev Mehta', role: 'member', studentId: 'DEMO-1006', department: 'Data Science' },
];

function readOrCreatePassword() {
  if (fs.existsSync(credentialsPath)) {
    const contents = fs.readFileSync(credentialsPath, 'utf8');
    const match = contents.match(/^DEMO_SEED_PASSWORD=(.+)$/m);
    if (!match) throw new Error('The local demo credentials file is missing its password entry; refusing to change demo accounts.');
    return match[1].trim();
  }
  const password = `Campus-${crypto.randomBytes(6).toString('hex')}!26`;
  const content = [
    '# Local-only demo credentials. This file is ignored by Git.',
    `DEMO_SEED_PASSWORD=${password}`,
    ...usersToSeed.map((user) => `DEMO_${user.key.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}_EMAIL=${user.email}`),
    '',
  ].join('\n');
  fs.writeFileSync(credentialsPath, content, { flag: 'wx', mode: 0o600 });
  return password;
}

function assertLocalDatabase(uri) {
  const parsed = new URL(uri);
  const localHosts = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
  if (!['mongodb:', 'mongodb+srv:'].includes(parsed.protocol) || !localHosts.has(parsed.hostname)) {
    throw new Error('Demo seeding is restricted to a local MongoDB host (localhost or 127.0.0.1).');
  }
}

async function ensureUser(definition, passwordHash) {
  let user = await User.findOne({ email: definition.email });
  if (user) {
    if (user.name !== definition.name || user.role !== definition.role || !user.isActive) {
      throw new Error(`Existing account ${definition.email} does not match the expected active demo account; no account was changed.`);
    }
    return user;
  }
  user = await User.create({ ...definition, passwordHash, isActive: true });
  return user;
}

async function ensureClub({ slug, name, category, description, president, admin, joinPolicy = 'open' }) {
  let club = await Club.findOne({ slug });
  if (!club) club = await Club.create({ slug, name, category, description, joinPolicy, createdBy: admin._id, isActive: true, memberCount: 0 });
  else if (club.name !== name) throw new Error(`A different club already uses the demo slug ${slug}; no club was changed.`);
  let membership = await ClubMembership.findOne({ club: club._id, user: president._id });
  if (!membership) await ClubMembership.create({ club: club._id, user: president._id, clubRole: 'president', status: 'active', decidedAt: new Date(), decidedBy: admin._id });
  else if (membership.clubRole !== 'president' || membership.status !== 'active') throw new Error(`Demo president membership for ${slug} is not active; no membership was changed.`);
  return club;
}

async function ensureMembership(club, user, { clubRole = 'member', status = 'active' } = {}) {
  const membership = await ClubMembership.findOne({ club: club._id, user: user._id });
  if (!membership) return ClubMembership.create({ club: club._id, user: user._id, clubRole, status, decidedAt: status === 'active' ? new Date() : undefined });
  if (membership.clubRole !== clubRole || membership.status !== status) throw new Error(`Existing demo membership for ${user.email} in ${club.slug} differs; no membership was changed.`);
  return membership;
}

async function ensureEvent(club, creator, values, coordinators = []) {
  const startsAt = new Date(Date.now() + values.daysFromNow * 86400000);
  startsAt.setUTCHours(values.hourUtc || 15, 0, 0, 0);
  const endsAt = new Date(startsAt.getTime() + values.durationHours * 3600000);
  const registrationDeadline = new Date(startsAt.getTime() - 86400000);
  const eventData = {
    club: club._id, title: values.title, description: values.description, category: values.category,
    startsAt, endsAt, location: values.location, capacity: values.capacity, registrationDeadline,
    status: values.status || 'published', visibility: values.visibility || 'public', createdBy: creator._id,
    coordinators: coordinators.map((user) => user._id),
  };
  let event = await Event.findOne({ club: club._id, title: values.title });
  if (!event) event = await Event.create(eventData);
  else {
    if (String(event.createdBy) !== String(creator._id)) throw new Error(`Event title ${values.title} is already used by a non-demo event; no event was changed.`);
    Object.assign(event, eventData);
    await event.save();
  }
  return event;
}

async function ensureRegistration(event, user) {
  let registration = await EventRegistration.findOne({ event: event._id, user: user._id });
  if (!registration) registration = await EventRegistration.create({ event: event._id, user: user._id, status: 'registered', registeredAt: new Date() });
  return registration;
}

async function seedDemoData() {
  const config = validateEnv();
  assertLocalDatabase(config.MONGO_URI);
  const password = readOrCreatePassword();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const users = {};
  for (const definition of usersToSeed) users[definition.key] = await ensureUser(definition, passwordHash);

  const robotics = await ensureClub({ slug: 'demo-robotics-society', name: 'Demo Robotics Society', category: 'technical', description: 'A hands-on community for building robots, learning embedded systems, and sharing engineering projects.', president: users.roboticsPresident, admin: users.admin });
  const photography = await ensureClub({ slug: 'demo-photography-club', name: 'Demo Photography Club', category: 'arts', description: 'Campus photographers sharing walks, workshops, and visual stories.', president: users.photographyPresident, admin: users.admin, joinPolicy: 'approval' });
  const dataClub = await ensureClub({ slug: 'demo-data-science-circle', name: 'Demo Data Science Circle', category: 'academic', description: 'Explore data, machine learning, and practical research with fellow students.', president: users.dataPresident, admin: users.admin });

  await Promise.all([
    ensureMembership(robotics, users.roboticsCoordinator, { clubRole: 'coordinator' }),
    ensureMembership(robotics, users.studentA), ensureMembership(robotics, users.studentB),
    ensureMembership(photography, users.studentA), ensureMembership(dataClub, users.studentB),
  ]);

  const eventSpecs = [
    { key: 'roboticsSeat', club: robotics, creator: users.roboticsPresident, values: { title: 'Demo Robotics Build Night', description: 'Build a line-following robot in teams. Bring a laptop if you have one; components are provided.', category: 'workshop', daysFromNow: 6, durationHours: 2, location: 'Engineering Lab 2', capacity: 1 } },
    { key: 'roboticsWorkshop', club: robotics, creator: users.roboticsPresident, coordinators: [users.roboticsCoordinator], values: { title: 'Demo Campus Robotics Workshop', description: 'An introductory workshop on sensors, motor control, and rapid prototyping. All experience levels are welcome.', category: 'workshop', daysFromNow: 9, durationHours: 3, location: 'Innovation Centre, Room 104', capacity: 24 } },
    { key: 'photoWalk', club: photography, creator: users.photographyPresident, values: { title: 'Demo Golden Hour Photo Walk', description: 'Explore composition and natural light on a guided campus photo walk.', category: 'social', daysFromNow: 12, durationHours: 2, location: 'Meet at the Main Library steps', capacity: 18, visibility: 'members_only' } },
    { key: 'dataTalk', club: dataClub, creator: users.dataPresident, values: { title: 'Demo Data Stories: From Question to Insight', description: 'A student-led talk about turning a real campus question into a useful data story.', category: 'talk', daysFromNow: 16, durationHours: 1, location: 'Seminar Hall B', capacity: 60 } },
  ];
  const events = {};
  for (const spec of eventSpecs) events[spec.key] = await ensureEvent(spec.club, spec.creator, spec.values, spec.coordinators || []);

  await Promise.all([
    ensureRegistration(events.roboticsSeat, users.studentA),
    ensureRegistration(events.roboticsWorkshop, users.studentA), ensureRegistration(events.roboticsWorkshop, users.studentB), ensureRegistration(events.roboticsWorkshop, users.roboticsCoordinator),
    ensureRegistration(events.photoWalk, users.studentA),
  ]);
  for (const club of [robotics, photography, dataClub]) {
    club.memberCount = await ClubMembership.countDocuments({ club: club._id, status: 'active' });
    await club.save();
  }
  for (const event of Object.values(events)) {
    event.registeredCount = await EventRegistration.countDocuments({ event: event._id, status: 'registered' });
    await event.save();
  }
  return { users, clubs: [robotics, photography, dataClub], events: Object.values(events) };
}

async function run() {
  let connected = false;
  try {
    const config = validateEnv();
    assertLocalDatabase(config.MONGO_URI);
    await connectDB(config.MONGO_URI);
    connected = true;
    const result = await seedDemoData();
    console.log(`Demo seed ready: ${result.users && Object.keys(result.users).length} demo accounts, ${result.clubs.length} clubs, ${result.events.length} events.`);
    console.log('Credentials are saved in backend/.env.demo.local; that file is ignored by Git.');
  } catch (error) {
    console.error(`Demo seeding failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    if (connected) await mongoose.disconnect();
  }
}

if (require.main === module) run();

module.exports = { assertLocalDatabase, seedDemoData, run };
