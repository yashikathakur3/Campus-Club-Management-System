const ApiError = require('../utils/ApiError');

// Phase 5 will provide ClubMembership and replace this null lookup with its model query.
// Keeping this interface now lets club routes share one authorization contract.
async function getMembership(userId, clubId) {
  void userId;
  void clubId;
  return null;
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
