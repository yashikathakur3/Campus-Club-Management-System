const mongoose = require('mongoose');
const Club = require('../models/Club');
const ClubMembership = require('../models/ClubMembership');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { notify } = require('./notificationService');
const { assertClubRole } = require('./clubAccessService');

function slugBase(name) {
  return name.normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'club';
}

function duplicateError(error) {
  return error?.code === 11000;
}

async function findClub(idOrSlug) {
  let club;
  if (mongoose.isValidObjectId(idOrSlug)) club = await Club.findById(idOrSlug);
  else club = await Club.findOne({ slug: idOrSlug });
  if (!club) throw new ApiError(404, 'NOT_FOUND', 'Club not found');
  return club;
}

async function uniqueSlug(name) {
  const base = slugBase(name);
  let slug = base;
  let suffix = 2;
  while (await Club.exists({ slug })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

async function createClub(actor, input) {
  const president = await User.findOne({ _id: input.presidentUserId, isActive: true });
  if (!president) throw new ApiError(400, 'INVALID_PRESIDENT', 'The selected president must be an active user');
  if (await Club.findOne({ name: input.name }).collation({ locale: 'en', strength: 2 })) {
    throw new ApiError(409, 'DUPLICATE_CLUB', 'A club with this name already exists');
  }
  let club;
  try {
    club = await Club.create({ ...input, slug: await uniqueSlug(input.name), createdBy: actor._id || actor.id });
  } catch (error) {
    if (duplicateError(error)) throw new ApiError(409, 'DUPLICATE_CLUB', 'A club with this name or slug already exists');
    throw error;
  }
  try {
    await ClubMembership.create({ club: club._id, user: president._id, clubRole: 'president', status: 'active', decidedAt: new Date(), decidedBy: actor._id || actor.id });
    club.memberCount = 1;
    await club.save();
  } catch (error) {
    await ClubMembership.deleteOne({ club: club._id, user: president._id });
    await Club.deleteOne({ _id: club._id });
    if (duplicateError(error)) throw new ApiError(409, 'ALREADY_MEMBER', 'The selected president already has a membership in this club');
    throw error;
  }
  return club;
}

async function listClubs({ page, limit, q, category, sort, order, includeInactive }, isAdmin) {
  const filter = {};
  if (!isAdmin || !includeInactive) filter.isActive = true;
  if (category) filter.category = category;
  if (q) filter.$text = { $search: q };
  const [clubs, total] = await Promise.all([
    Club.find(filter).sort({ [sort]: order === 'asc' ? 1 : -1, _id: 1 }).skip((page - 1) * limit).limit(limit),
    Club.countDocuments(filter),
  ]);
  return { clubs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getClub(idOrSlug, user) {
  const club = await findClub(idOrSlug);
  const [presidentMembership, coordinatorMemberships, memberPreview, myMembership] = await Promise.all([
    ClubMembership.findOne({ club: club._id, clubRole: 'president', status: 'active' }).populate({ path: 'user', select: 'name email avatarUrl department', match: { isActive: true } }),
    ClubMembership.find({ club: club._id, clubRole: 'coordinator', status: 'active' }).populate({ path: 'user', select: 'name email avatarUrl department', match: { isActive: true } }).sort({ createdAt: 1 }).limit(8),
    user ? ClubMembership.find({ club: club._id, status: 'active' }).populate({ path: 'user', select: 'name email avatarUrl department', match: { isActive: true } }).sort({ createdAt: -1 }).limit(8) : [],
    user ? ClubMembership.findOne({ club: club._id, user: user._id, status: { $ne: 'rejected' } }) : null,
  ]);
  const isMember = user?.role === 'super_admin' || Boolean(await ClubMembership.exists({ club: club._id, user: user?._id, status: 'active' }));
  return {
    club,
    president: presidentMembership?.user || null,
    coordinators: coordinatorMemberships.map((item) => item.user).filter(Boolean),
    membersPreview: isMember ? memberPreview.map((item) => item.user).filter(Boolean) : undefined,
    myMembership: myMembership ? { clubRole: myMembership.clubRole, status: myMembership.status, canAnnounce: myMembership.canAnnounce } : null,
  };
}

async function updateClub(actor, idOrSlug, changes) {
  const club = await findClub(idOrSlug);
  await assertClubRole(actor, club._id, ['president']);
  if (changes.name && await Club.findOne({ _id: { $ne: club._id }, name: changes.name }).collation({ locale: 'en', strength: 2 })) {
    throw new ApiError(409, 'DUPLICATE_CLUB', 'A club with this name already exists');
  }
  Object.assign(club, changes);
  try { await club.save(); }
  catch (error) { if (duplicateError(error)) throw new ApiError(409, 'DUPLICATE_CLUB', 'A club with this name already exists'); throw error; }
  return club;
}

async function setClubStatus(idOrSlug, isActive) {
  const club = await findClub(idOrSlug);
  club.isActive = isActive;
  await club.save();
  return club;
}

async function joinClub(user, idOrSlug, message = '') {
  const club = await findClub(idOrSlug);
  if (!club.isActive) throw new ApiError(409, 'CLUB_INACTIVE', 'This club is not accepting membership requests');
  const status = club.joinPolicy === 'open' ? 'active' : 'pending';
  let membership = await ClubMembership.findOneAndUpdate(
    { club: club._id, user: user._id, status: { $in: ['left', 'rejected'] } },
    { $set: { status, clubRole: 'member', message, requestedAt: new Date(), decidedAt: status === 'active' ? new Date() : null, decidedBy: status === 'active' ? club.createdBy : null, canAnnounce: false } },
    { returnDocument: 'after' },
  );
  let created = false;
  if (!membership) {
    try {
      membership = await ClubMembership.create({ club: club._id, user: user._id, status, message, clubRole: 'member', decidedAt: status === 'active' ? new Date() : undefined, decidedBy: status === 'active' ? club.createdBy : undefined });
      created = true;
    } catch (error) {
      if (!duplicateError(error)) throw error;
      const existing = await ClubMembership.findOne({ club: club._id, user: user._id });
      if (existing?.status === 'pending') throw new ApiError(409, 'ALREADY_PENDING', 'Your request is already waiting for a decision');
      if (existing?.status === 'active') throw new ApiError(409, 'ALREADY_MEMBER', 'You are already a member of this club');
      throw error;
    }
  }
  if (status === 'active') await Club.updateOne({ _id: club._id }, { $inc: { memberCount: 1 } });
  const leaders = await ClubMembership.find({ club: club._id, status: 'active', clubRole: { $in: ['president', 'coordinator'] } }).distinct('user');
  await notify(leaders, { type: 'club_join_request', clubId: club._id, userId: user._id, status });
  return { membership, created };
}

async function leaveClub(user, idOrSlug) {
  const club = await findClub(idOrSlug);
  const active = await ClubMembership.findOne({ club: club._id, user: user._id, status: 'active' });
  if (active?.clubRole === 'president') throw new ApiError(409, 'PRESIDENT_CANNOT_LEAVE', 'Transfer the presidency before leaving this club');
  const membership = await ClubMembership.findOneAndUpdate(
    { club: club._id, user: user._id, status: { $in: ['active', 'pending'] } },
    { $set: { status: 'left', decidedAt: new Date(), decidedBy: user._id } },
    { returnDocument: 'after' },
  );
  if (!membership) throw new ApiError(409, 'NOT_A_MEMBER', 'You do not have a membership to leave');
  if (active) await Club.updateOne({ _id: club._id, memberCount: { $gt: 0 } }, { $inc: { memberCount: -1 } });
  return membership;
}

async function manageMembership(actor, idOrSlug, userId, changes) {
  const club = await findClub(idOrSlug);
  await assertClubRole(actor, club._id, ['president']);
  const current = await ClubMembership.findOne({ club: club._id, user: userId });
  if (!current) throw new ApiError(404, 'NOT_FOUND', 'Club membership not found');
  if (current.clubRole === 'president') throw new ApiError(409, 'PRESIDENT_MEMBERSHIP_LOCKED', 'Transfer the presidency to change this membership');
  if (changes.status === 'active' || changes.status === 'rejected') {
    if (current.status !== 'pending') throw new ApiError(409, 'MEMBERSHIP_NOT_PENDING', 'Only pending requests can be approved or rejected');
    if (changes.status === 'active') {
      const member = await User.findOne({ _id: current.user, isActive: true });
      if (!member) throw new ApiError(409, 'USER_INACTIVE', 'An inactive user cannot be approved');
    }
    const updated = await ClubMembership.findOneAndUpdate({ _id: current._id, status: 'pending' }, {
      $set: { status: changes.status, decidedAt: new Date(), decidedBy: actor._id || actor.id },
    }, { returnDocument: 'after' });
    if (!updated) throw new ApiError(409, 'MEMBERSHIP_ALREADY_DECIDED', 'This request has already been decided');
    if (changes.status === 'active') await Club.updateOne({ _id: club._id }, { $inc: { memberCount: 1 } });
    await notify([updated.user], { type: changes.status === 'active' ? 'club_join_approved' : 'club_join_rejected', clubId: club._id, decidedBy: actor._id || actor.id });
    return updated;
  }
  if (changes.status === 'removed') {
    const updated = await ClubMembership.findOneAndUpdate({ _id: current._id, status: 'active' }, {
      $set: { status: 'removed', decidedAt: new Date(), decidedBy: actor._id || actor.id },
    }, { returnDocument: 'after' });
    if (!updated) throw new ApiError(409, 'MEMBERSHIP_NOT_ACTIVE', 'Only active members can be removed');
    await Club.updateOne({ _id: club._id, memberCount: { $gt: 0 } }, { $inc: { memberCount: -1 } });
    return updated;
  }
  if (changes.clubRole || changes.canAnnounce !== undefined) {
    if (current.status !== 'active') throw new ApiError(409, 'MEMBERSHIP_NOT_ACTIVE', 'Only active members can be updated');
    const patch = {};
    if (changes.clubRole) patch.clubRole = changes.clubRole;
    if (changes.canAnnounce !== undefined) patch.canAnnounce = changes.canAnnounce;
    const updated = await ClubMembership.findOneAndUpdate({ _id: current._id, status: 'active', clubRole: { $ne: 'president' } }, { $set: patch }, { returnDocument: 'after' });
    if (!updated) throw new ApiError(409, 'MEMBERSHIP_CHANGED', 'This membership changed while you were updating it');
    return updated;
  }
  throw new ApiError(400, 'VALIDATION_ERROR', 'No membership changes were provided');
}

async function transferPresidency(actor, idOrSlug, userId) {
  const club = await findClub(idOrSlug);
  await assertClubRole(actor, club._id, ['president']);
  const target = await ClubMembership.findOne({ club: club._id, user: userId, status: 'active', clubRole: { $in: ['member', 'coordinator'] } });
  if (!target) throw new ApiError(400, 'INVALID_SUCCESSOR', 'The new president must be an active club member');
  const current = await ClubMembership.findOneAndUpdate({ club: club._id, status: 'active', clubRole: 'president' }, {
    $set: { clubRole: 'coordinator', decidedAt: new Date(), decidedBy: actor._id || actor.id },
  }, { returnDocument: 'after' });
  if (!current) throw new ApiError(409, 'PRESIDENT_NOT_FOUND', 'This club has no active president');
  const next = await ClubMembership.findOneAndUpdate({ _id: target._id, status: 'active', clubRole: { $in: ['member', 'coordinator'] } }, {
    $set: { clubRole: 'president', decidedAt: new Date(), decidedBy: actor._id || actor.id },
  }, { returnDocument: 'after' });
  if (!next) {
    await ClubMembership.updateOne({ _id: current._id, status: 'active', clubRole: 'coordinator' }, { $set: { clubRole: 'president' } });
    throw new ApiError(409, 'INVALID_SUCCESSOR', 'The new president must remain an active club member');
  }
  return { president: next, previousPresident: current };
}

async function listMembers(actor, idOrSlug, { page, limit, status }) {
  const club = await findClub(idOrSlug);
  if (status === 'pending') await assertClubRole(actor, club._id, ['president']);
  else await assertClubRole(actor, club._id, ['member', 'coordinator', 'president']);
  const activeUserIds = await User.find({ isActive: true }).distinct('_id');
  const filter = { club: club._id, status, user: { $in: activeUserIds } };
  const [memberships, total] = await Promise.all([
    ClubMembership.find(filter).populate({ path: 'user', select: 'name email avatarUrl department studentId', match: { isActive: true } }).sort({ createdAt: 1 }).skip((page - 1) * limit).limit(limit),
    ClubMembership.countDocuments(filter),
  ]);
  return { members: memberships.filter((item) => item.user), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function myMemberships(userId) {
  return ClubMembership.find({ user: userId, status: { $in: ['pending', 'active'] } })
    .populate({ path: 'club', select: 'name slug logoUrl category description memberCount joinPolicy isActive' })
    .sort({ updatedAt: -1 });
}

async function recountMembers(clubId) {
  const count = await ClubMembership.countDocuments({ club: clubId, status: 'active' });
  await Club.updateOne({ _id: clubId }, { $set: { memberCount: count } });
  return count;
}

module.exports = { createClub, findClub, listClubs, getClub, updateClub, setClubStatus, joinClub, leaveClub, manageMembership, transferPresidency, listMembers, myMemberships, recountMembers, slugBase };

