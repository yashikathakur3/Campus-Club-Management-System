const ClubMembership = require('../models/ClubMembership');
const ApiError = require('../utils/ApiError');

async function getMembership(userId, clubId) {
  if (!userId || !clubId) return null;
  return ClubMembership.findOne({ club: clubId, user: userId, status: 'active' });
}

async function assertClubRole(user, clubId, allowedClubRoles) {
  if (user?.role === 'super_admin') return null;
  const membership = await getMembership(user?._id || user?.id, clubId);
  if (!membership || !allowedClubRoles.includes(membership.clubRole)) {
    throw new ApiError(403, 'FORBIDDEN', 'You do not have the required club role');
  }
  return membership;
}

module.exports = { getMembership, assertClubRole };
