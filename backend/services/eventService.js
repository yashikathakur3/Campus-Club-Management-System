const mongoose = require('mongoose');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const Club = require('../models/Club');
const ClubMembership = require('../models/ClubMembership');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { assertClubRole, getMembership } = require('./clubAccessService');
const { notify } = require('./notificationService');

const isAdmin = (user) => user?.role === 'super_admin';
const idOf = (user) => user?._id || user?.id;
function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function spotsLeft(event) { return Math.max(0, event.capacity - event.registeredCount); }
function eventView(event, extras = {}) { return { ...event.toObject(), spotsLeft: spotsLeft(event), isPast: event.endsAt <= new Date(), ...extras }; }
async function findClub(idOrSlug) {
  const club = mongoose.isValidObjectId(idOrSlug) ? await Club.findById(idOrSlug) : await Club.findOne({ slug: idOrSlug });
  if (!club) throw new ApiError(404, 'NOT_FOUND', 'Club not found');
  return club;
}
async function findEvent(id) {
  const event = await Event.findById(id);
  if (!event) throw new ApiError(404, 'NOT_FOUND', 'Event not found');
  return event;
}
async function ensureCanManageClub(user, clubId) {
  if (isAdmin(user)) return { clubRole: 'president' };
  const membership = await getMembership(idOf(user), clubId);
  if (!membership || !['president', 'coordinator'].includes(membership.clubRole)) throw new ApiError(403, 'FORBIDDEN', 'You cannot manage events for this club');
  return membership;
}
async function assertEventManager(user, event, { presidentOnly = false } = {}) {
  if (isAdmin(user)) return;
  const membership = await getMembership(idOf(user), event.club);
  if (!membership || membership.clubRole !== 'president' && (presidentOnly || membership.clubRole !== 'coordinator' || !event.coordinators.some((id) => String(id) === String(idOf(user))))) {
    throw new ApiError(403, 'FORBIDDEN', 'You do not have permission to manage this event');
  }
}
function eventInput(input, clubId, userId, membership) {
  const data = { ...input, club: clubId, createdBy: userId };
  if (!data.registrationDeadline) data.registrationDeadline = data.startsAt;
  if (membership?.clubRole === 'coordinator') { data.status = 'draft'; data.coordinators = data.coordinators?.filter((id) => String(id) === String(userId)) || [userId]; }
  else if (!data.coordinators) data.coordinators = [];
  return data;
}
async function createEvent(user, clubId, input) {
  const club = await findClub(clubId);
  if (!club.isActive) throw new ApiError(409, 'CLUB_INACTIVE', 'Events cannot be created for an inactive club');
  const membership = await ensureCanManageClub(user, club._id);
  const coordinators = input.coordinators || [];
  if (membership.clubRole === 'president' && coordinators.length) {
    const active = await ClubMembership.find({ club: club._id, user: { $in: coordinators }, status: 'active', clubRole: 'coordinator' }).distinct('user');
    if (active.length !== coordinators.length) throw new ApiError(400, 'INVALID_COORDINATOR', 'Each event coordinator must be an active club coordinator');
  }
  return Event.create(eventInput(input, club._id, idOf(user), membership));
}
async function listPublicEvents(query) {
  const filter = { status: 'published' };
  if (query.category) filter.category = query.category;
  if (query.clubId) filter.club = query.clubId;
  if (query.q) { const literal = new RegExp(escapeRegex(query.q), 'i'); filter.$or = [{ title: literal }, { description: literal }]; }
  if (query.from || query.to) filter.startsAt = { ...(query.from ? { $gte: query.from } : {}), ...(query.to ? { $lte: query.to } : {}) };
  if (query.when === 'upcoming') filter.endsAt = { $gte: new Date() };
  if (query.when === 'past') filter.endsAt = { $lt: new Date() };
  if (query.available) filter.$expr = { [query.available ? '$gt' : '$eq']: ['$capacity', '$registeredCount'] };
  const [rows, total] = await Promise.all([
    Event.find(filter).populate({ path: 'club', select: 'name slug logoUrl category' }).sort({ startsAt: query.order === 'desc' ? -1 : 1, _id: 1 }).skip((query.page - 1) * query.limit).limit(query.limit),
    Event.countDocuments(filter),
  ]);
  const events = rows.map((event) => eventView(event));
  return { events, meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
}
async function getEvent(user, id) {
  const event = await findEvent(id);
  if (event.endsAt <= new Date() && event.status === 'published') {
    // Detail reads lazily settle elapsed published events. List reads remain side-effect free.
    await Event.updateOne({ _id: event._id, status: 'published', endsAt: { $lte: new Date() } }, { $set: { status: 'completed' } });
    event.status = 'completed';
  }
  if (event.status === 'draft') {
    const membership = user ? await getMembership(idOf(user), event.club) : null;
    const canReadDraft = user && (isAdmin(user) || membership?.clubRole === 'president' || (membership?.clubRole === 'coordinator' && event.coordinators.some((id) => String(id) === String(idOf(user)))));
    if (!canReadDraft) throw new ApiError(404, 'NOT_FOUND', 'Event not found');
  }
  const [club, registration] = await Promise.all([
    Club.findById(event.club).select('name slug logoUrl category'),
    user ? EventRegistration.findOne({ event: event._id, user: idOf(user) }).select('status registeredAt cancelledAt') : null,
  ]);
  return eventView(event, { club, myRegistration: registration });
}
async function listClubEvents(user, clubId, query) {
  const club = await findClub(clubId);
  await ensureCanManageClub(user, club._id);
  const filter = { club: club._id };
  if (query.status) filter.status = query.status;
  const [events, total] = await Promise.all([
    Event.find(filter).sort({ startsAt: 1 }).skip((query.page - 1) * query.limit).limit(query.limit),
    Event.countDocuments(filter),
  ]);
  return { events: events.map((item) => eventView(item)), meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
}
async function updateEvent(user, id, changes) {
  const event = await findEvent(id);
  if (['cancelled', 'completed'].includes(event.status)) throw new ApiError(409, 'EVENT_LOCKED', 'Cancelled or completed events cannot be edited');
  await assertEventManager(user, event);
  if (changes.capacity !== undefined && changes.capacity < event.registeredCount) throw new ApiError(409, 'CAPACITY_BELOW_REGISTERED', 'Capacity cannot be lower than the registered count');
  if (changes.startsAt || changes.endsAt) {
    const start = changes.startsAt || event.startsAt; const end = changes.endsAt || event.endsAt;
    if (end <= start) throw new ApiError(400, 'VALIDATION_ERROR', 'Event end must be after its start');
  }
  if (changes.registrationDeadline || changes.startsAt) {
    const deadline = changes.registrationDeadline || event.registrationDeadline; const start = changes.startsAt || event.startsAt;
    if (deadline > start) throw new ApiError(400, 'VALIDATION_ERROR', 'Registration deadline must be at or before event start');
  }
  if (changes.coordinators) {
    const active = await ClubMembership.find({ club: event.club, user: { $in: changes.coordinators }, status: 'active', clubRole: 'coordinator' }).distinct('user');
    if (active.length !== changes.coordinators.length) throw new ApiError(400, 'INVALID_COORDINATOR', 'Each event coordinator must be an active club coordinator');
  }
  Object.assign(event, changes);
  await event.save();
  return event;
}
async function changeEventStatus(user, id, action) {
  const event = await findEvent(id);
  await assertEventManager(user, event, { presidentOnly: true });
  if (action === 'publish') {
    if (event.status !== 'draft') throw new ApiError(409, 'EVENT_NOT_DRAFT', 'Only draft events can be published');
    event.status = 'published'; await event.save();
  } else {
    if (event.status === 'completed') throw new ApiError(409, 'EVENT_LOCKED', 'Completed events cannot be cancelled');
    if (event.status === 'cancelled') return event;
    event.status = 'cancelled'; await event.save();
    const userIds = await EventRegistration.find({ event: event._id, status: 'registered' }).distinct('user');
    await notify(userIds, { type: 'event_cancelled', eventId: event._id, clubId: event.club });
  }
  return event;
}
async function listRegistrations(user, eventId, { q, page, limit }) {
  const event = await findEvent(eventId); await assertEventManager(user, event);
  const filter = { event: event._id, status: 'registered' };
  if (q) { const literal = new RegExp(escapeRegex(q), 'i'); const users = await User.find({ $or: [{ name: literal }, { email: literal }, { studentId: literal }], isActive: true }).distinct('_id'); filter.user = { $in: users }; }
  const [rows, total] = await Promise.all([
    EventRegistration.find(filter).populate({ path: 'user', select: 'name email studentId department avatarUrl', match: { isActive: true } }).sort({ registeredAt: 1 }).skip((page - 1) * limit).limit(limit),
    EventRegistration.countDocuments(filter),
  ]);
  return { registrations: rows.filter((row) => row.user), summary: { registeredCount: event.registeredCount, capacity: event.capacity, spotsLeft: spotsLeft(event) }, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
async function myRegistrations(user, { status, when, page, limit }) {
  const filter = { user: idOf(user) };
  if (status) filter.status = status;
  if (!status) filter.status = { $in: ['registered', 'cancelled'] };
  if (when) filter.event = { $in: await Event.find({ endsAt: when === 'past' ? { $lt: new Date() } : { $gte: new Date() } }).distinct('_id') };
  const [filtered, total] = await Promise.all([
    EventRegistration.find(filter).populate({ path: 'event', populate: { path: 'club', select: 'name slug logoUrl' } }).sort({ registeredAt: -1 }).skip((page - 1) * limit).limit(limit),
    EventRegistration.countDocuments(filter),
  ]);
  return { registrations: filtered.filter((item) => item.event), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
module.exports = { createEvent, listPublicEvents, getEvent, listClubEvents, updateEvent, changeEventStatus, listRegistrations, myRegistrations, spotsLeft };
