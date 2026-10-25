const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const Club = require('../models/Club');
const ClubMembership = require('../models/ClubMembership');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const { signAccessToken } = require('../utils/token');
const { recountRegistrations } = require('../services/registrationService');

async function main() {
  const mongo = await MongoMemoryServer.create({ instance: { dbName: 'campus_club_events_test' } });
  try {
    await mongoose.connect(mongo.getUri('campus_club_events_test'));
    await Promise.all([User.init(), Club.init(), ClubMembership.init(), Event.init(), EventRegistration.init()]);
    const passwordHash = 'unused-test-password-hash';
    const [admin, president, coordinator, otherPresident, member, blocked] = await Promise.all([
      User.create({ name: 'Events Admin', email: 'events-admin@test.invalid', passwordHash, role: 'super_admin' }),
      User.create({ name: 'Events President', email: 'events-president@test.invalid', passwordHash }),
      User.create({ name: 'Events Coordinator', email: 'events-coordinator@test.invalid', passwordHash }),
      User.create({ name: 'Other President', email: 'events-other@test.invalid', passwordHash }),
      User.create({ name: 'Regular Student', email: 'events-member@test.invalid', passwordHash }),
      User.create({ name: 'Blocked Member', email: 'events-blocked@test.invalid', passwordHash }),
    ]);
    const tokens = new Map([admin, president, coordinator, otherPresident, member, blocked].map((u) => [String(u._id), signAccessToken(u)]));
    const auth = (u) => ({ Authorization: `Bearer ${tokens.get(String(u._id))}` });
    const [club, otherClub] = await Promise.all([
      Club.create({ name: 'Event Lab', slug: 'event-lab', category: 'technical', createdBy: admin._id, joinPolicy: 'open' }),
      Club.create({ name: 'Other Event Lab', slug: 'other-event-lab', category: 'academic', createdBy: admin._id }),
    ]);
    await ClubMembership.create([
      { club: club._id, user: president._id, clubRole: 'president', status: 'active' },
      { club: club._id, user: coordinator._id, clubRole: 'coordinator', status: 'active' },
      { club: club._id, user: member._id, clubRole: 'member', status: 'active' },
      { club: club._id, user: blocked._id, clubRole: 'member', status: 'active' },
      { club: otherClub._id, user: otherPresident._id, clubRole: 'president', status: 'active' },
    ]);

    const base = (patch = {}) => ({ title: 'Campus Robotics Workshop', description: 'Build and test small robots.', category: 'workshop', startsAt: new Date(Date.now() + 86400000).toISOString(), endsAt: new Date(Date.now() + 90000000).toISOString(), location: 'Engineering Hall', capacity: 3, visibility: 'public', ...patch });
    const created = (clubId, user, body) => request(app).post(`/api/v1/clubs/${clubId}/events`).set(auth(user)).send(body);
    await created(club._id, member, base()).expect(403);
    await created(club._id, otherPresident, base()).expect(403);
    let response = await created(club._id, coordinator, base()).expect(201);
    const draft = response.body.data.event; assert.equal(draft.status, 'draft');
    await request(app).patch(`/api/v1/events/${draft._id}/status`).set(auth(coordinator)).send({ action: 'publish' }).expect(403);
    response = await created(club._id, president, base()).expect(201);
    let event = response.body.data.event; assert.equal(event.status, 'draft');
    await request(app).post(`/api/v1/clubs/${club._id}/events`).set(auth(president)).send(base({ endsAt: new Date(Date.now() + 1000).toISOString(), startsAt: new Date(Date.now() + 2000).toISOString() })).expect(400);
    await created(club._id, president, base({ capacity: 0 })).expect(400);
    await created(club._id, president, base({ registrationDeadline: new Date(Date.now() + 90000000).toISOString() })).expect(400);
    await request(app).patch(`/api/v1/events/${event._id}/status`).set(auth(president)).send({ action: 'publish' }).expect(200);
    await request(app).patch(`/api/v1/events/${draft._id}`).set(auth(otherPresident)).send({ title: 'Unauthorized edit' }).expect(403);

    event = await Event.create({ club: club._id, ...base({ title: 'Concurrency Event', capacity: 3 }), createdBy: president._id, status: 'published', registrationDeadline: new Date(Date.now() + 80000000) });
    const attendees = await Promise.all(Array.from({ length: 10 }, (_, index) => User.create({ name: `Attendee ${index}`, email: `attendee-${index}@test.invalid`, passwordHash })));
    const outcomes = await Promise.all(attendees.map((u) => request(app).post(`/api/v1/events/${event._id}/register`).set({ Authorization: `Bearer ${signAccessToken(u)}` })));
    assert.equal(outcomes.filter((r) => r.status === 201).length, 3);
    assert.equal(outcomes.filter((r) => r.status === 409 && r.body.error.code === 'EVENT_FULL').length, 7);
    assert.equal((await Event.findById(event._id)).registeredCount, 3);
    assert.equal(await EventRegistration.countDocuments({ event: event._id, status: 'registered' }), 3);
    await request(app).patch(`/api/v1/events/${event._id}`).set(auth(president)).send({ capacity: 2 }).expect(409);

    const assigned = await Event.create({ club: club._id, ...base({ title: 'Coordinator Attendee Event' }), createdBy: president._id, coordinators: [coordinator._id], status: 'published', registrationDeadline: new Date(Date.now() + 80000000) });
    await request(app).get(`/api/v1/events/${assigned._id}/registrations`).set(auth(coordinator)).expect(200);

    const sameUser = attendees[0];
    const duplicateEvent = await Event.create({ club: club._id, ...base({ title: 'Duplicate Event', capacity: 10 }), createdBy: president._id, status: 'published', registrationDeadline: new Date(Date.now() + 80000000) });
    const sameResults = await Promise.all(Array.from({ length: 5 }, () => request(app).post(`/api/v1/events/${duplicateEvent._id}/register`).set({ Authorization: `Bearer ${signAccessToken(sameUser)}` })));
    assert.equal(sameResults.filter((r) => r.status === 201).length, 1);
    assert.equal((await Event.findById(duplicateEvent._id)).registeredCount, 1);
    assert.equal(await EventRegistration.countDocuments({ event: duplicateEvent._id, user: sameUser._id }), 1);
    await request(app).post(`/api/v1/events/${duplicateEvent._id}/register`).set({ Authorization: `Bearer ${signAccessToken(sameUser)}` }).expect(409);
    await request(app).delete(`/api/v1/events/${duplicateEvent._id}/register`).set({ Authorization: `Bearer ${signAccessToken(sameUser)}` }).expect(200);
    await request(app).delete(`/api/v1/events/${duplicateEvent._id}/register`).set({ Authorization: `Bearer ${signAccessToken(sameUser)}` }).expect(200);
    assert.equal((await Event.findById(duplicateEvent._id)).registeredCount, 0);
    await request(app).post(`/api/v1/events/${duplicateEvent._id}/register`).set({ Authorization: `Bearer ${signAccessToken(sameUser)}` }).expect(201);
    assert.equal((await Event.findById(duplicateEvent._id)).registeredCount, 1);
    assert.equal(await recountRegistrations(duplicateEvent._id), 1);

    const membersOnly = await Event.create({ club: club._id, ...base({ title: 'Members Event', visibility: 'members_only', capacity: 3 }), createdBy: president._id, status: 'published', registrationDeadline: new Date(Date.now() + 80000000) });
    await request(app).post(`/api/v1/events/${membersOnly._id}/register`).set({ Authorization: `Bearer ${signAccessToken(attendees[1])}` }).expect(403);
    await request(app).post(`/api/v1/events/${membersOnly._id}/register`).set(auth(member)).expect(201);
    await request(app).post(`/api/v1/events/${membersOnly._id}/register`).set(auth(admin)).expect(201);
    const expired = await Event.create({ club: club._id, ...base({ title: 'Expired Event' }), createdBy: president._id, status: 'published', registrationDeadline: new Date(Date.now() - 1000) });
    await request(app).post(`/api/v1/events/${expired._id}/register`).set(auth(member)).expect(409);
    await request(app).post(`/api/v1/events/${draft._id}/register`).set(auth(member)).expect(409);
    await request(app).patch(`/api/v1/events/${event._id}/status`).set(auth(president)).send({ action: 'cancel' }).expect(200);
    await request(app).post(`/api/v1/events/${event._id}/register`).set(auth(member)).expect(409);
    await request(app).get(`/api/v1/events/${event._id}`).expect(200);

    response = await request(app).get('/api/v1/events?q=Robotics&category=workshop&when=upcoming&page=1&limit=1').expect(200);
    assert.equal(response.body.data.length, 1); assert.equal(response.body.meta.limit, 1);
    response = await request(app).get(`/api/v1/clubs/${club._id}/events?page=1&limit=1`).set(auth(president)).expect(200);
    assert.equal(response.body.meta.limit, 1);
    response = await request(app).get(`/api/v1/events/${duplicateEvent._id}/registrations?q=${encodeURIComponent(sameUser.email)}`).set(auth(president)).expect(200);
    assert.equal(response.body.data.length, 1);
    await request(app).get(`/api/v1/events/${event._id}/registrations`).set(auth(member)).expect(403);
    console.log('Event integration checks passed');
  } finally {
    await mongoose.disconnect(); await mongo.stop();
  }
}
main().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
