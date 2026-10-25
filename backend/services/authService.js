const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { signAccessToken } = require('../utils/token');
const ClubMembership = require('../models/ClubMembership');

const BCRYPT_ROUNDS = 12;

async function register(input) {
  const { name, email, password, studentId, department } = input;
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, studentId, department, role: 'member' });
  return { user, token: signAccessToken(user) };
}

async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash +tokenVersion');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Invalid email or password');
  }
  if (!user.isActive) throw new ApiError(403, 'ACCOUNT_DISABLED', 'This account is disabled');

  user.lastLoginAt = new Date();
  await user.save();
  return { user, token: signAccessToken(user) };
}

async function getCurrentUser(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(401, 'UNAUTHENTICATED', 'Authentication is required or the token is invalid');
  const memberships = await ClubMembership.find({ user: userId, status: { $ne: 'rejected' } })
    .populate({ path: 'club', select: 'name slug logoUrl' }).sort({ updatedAt: -1 });
  return { user, memberships: memberships.filter((membership) => membership.club).map((membership) => ({
    club: membership.club,
    clubRole: membership.clubRole,
    status: membership.status,
    canAnnounce: membership.canAnnounce,
  })) };
}

async function updateProfile(userId, changes) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(401, 'UNAUTHENTICATED', 'Authentication is required or the token is invalid');
  Object.assign(user, changes);
  await user.save();
  return user;
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+passwordHash +tokenVersion');
  if (!user) throw new ApiError(401, 'UNAUTHENTICATED', 'Authentication is required or the token is invalid');
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(400, 'INVALID_CURRENT_PASSWORD', 'Current password is incorrect');
  }

  user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  user.tokenVersion += 1;
  await user.save();
  return { user, token: signAccessToken(user) };
}

module.exports = { register, login, getCurrentUser, updateProfile, changePassword, BCRYPT_ROUNDS };
