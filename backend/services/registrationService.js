const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const ClubMembership = require('../models/ClubMembership');
const ApiError = require('../utils/ApiError');

function conflict(code, message) { return new ApiError(409, code, message); }

async function registerForEvent(user, eventId) {
  const event = await Event.findById(eventId);
  if (!event) throw new ApiError(404, 'NOT_FOUND', 'Event not found');
  const now = new Date();
  if (event.status !== 'published') throw conflict('EVENT_NOT_OPEN', 'This event is not open for registration');
  if (event.registrationDeadline <= now) throw conflict('REGISTRATION_CLOSED', 'Registration deadline has passed');
  if (event.endsAt <= now) throw conflict('REGISTRATION_CLOSED', 'This event has already ended');
  if (event.visibility === 'members_only' && user.role !== 'super_admin' && !await ClubMembership.exists({ club: event.club, user: user._id, status: 'active' })) {
    throw new ApiError(403, 'MEMBERSHIP_REQUIRED', 'Active club membership is required to register');
  }

  const reserved = await Event.findOneAndUpdate(
    { _id: event._id, status: 'published', $expr: { $lt: ['$registeredCount', '$capacity'] } },
    { $inc: { registeredCount: 1 } }, { returnDocument: 'after' },
  );
  if (!reserved) throw conflict('EVENT_FULL', 'This event has no spots left');

  try {
    let registration = await EventRegistration.findOneAndUpdate(
      { event: event._id, user: user._id, status: 'cancelled' },
      { $set: { status: 'registered', registeredAt: now }, $unset: { cancelledAt: 1 } }, { returnDocument: 'after' },
    );
    if (!registration) registration = await EventRegistration.create({ event: event._id, user: user._id, status: 'registered', registeredAt: now });
    return { registration, event: reserved };
  } catch (error) {
    await Event.updateOne({ _id: event._id, registeredCount: { $gt: 0 } }, { $inc: { registeredCount: -1 } });
    if (error?.code === 11000) throw conflict('ALREADY_REGISTERED', 'You are already registered for this event');
    throw error;
  }
}

async function cancelRegistration(user, eventId) {
  const registration = await EventRegistration.findOneAndUpdate(
    { event: eventId, user: user._id, status: 'registered' },
    { $set: { status: 'cancelled', cancelledAt: new Date() } }, { returnDocument: 'after' },
  );
  if (!registration) {
    const existing = await EventRegistration.findOne({ event: eventId, user: user._id });
    if (!existing) throw new ApiError(404, 'NOT_REGISTERED', 'You are not registered for this event');
    return { registration: existing, message: 'Registration was already cancelled' };
  }
  await Event.updateOne({ _id: eventId, registeredCount: { $gt: 0 } }, { $inc: { registeredCount: -1 } });
  return { registration, message: 'Registration cancelled' };
}

async function recountRegistrations(eventId) {
  const registeredCount = await EventRegistration.countDocuments({ event: eventId, status: 'registered' });
  await Event.updateOne({ _id: eventId }, { $set: { registeredCount } });
  return registeredCount;
}

module.exports = { registerForEvent, cancelRegistration, recountRegistrations };
