const clubService = require('../services/clubService');
const ClubMembership = require('../models/ClubMembership');
const { sendSuccess } = require('../utils/response');

async function list(req, res) {
  const result = await clubService.listClubs(req.query, req.user?.role === 'super_admin');
  return sendSuccess(res, result.clubs, { meta: result.meta });
}
async function get(req, res) { return sendSuccess(res, await clubService.getClub(req.params.id, req.user)); }
async function create(req, res) { return sendSuccess(res, { club: await clubService.createClub(req.user, req.body) }, { status: 201 }); }
async function patch(req, res) { return sendSuccess(res, { club: await clubService.updateClub(req.user, req.params.id, req.body) }); }
async function status(req, res) { return sendSuccess(res, { club: await clubService.setClubStatus(req.params.id, req.body.isActive) }); }
async function join(req, res) {
  const result = await clubService.joinClub(req.user, req.params.id, req.body.message || '');
  return sendSuccess(res, { membership: result.membership }, { status: 201 });
}
async function leave(req, res) { return sendSuccess(res, { membership: await clubService.leaveClub(req.user, req.params.id) }); }
async function members(req, res) {
  const result = await clubService.listMembers(req.user, req.params.id, req.query);
  return sendSuccess(res, result.members, { meta: result.meta });
}
async function patchMember(req, res) { return sendSuccess(res, { membership: await clubService.manageMembership(req.user, req.params.id, req.params.userId, req.body) }); }
async function transfer(req, res) { return sendSuccess(res, await clubService.transferPresidency(req.user, req.params.id, req.body.userId)); }
async function myMemberships(req, res) {
  const memberships = await ClubMembership.find({ user: req.user._id, status: { $ne: 'rejected' } })
    .populate({ path: 'club', select: 'name slug logoUrl' }).sort({ updatedAt: -1 });
  return sendSuccess(res, memberships.filter((item) => item.club).map((item) => ({ club: item.club, clubRole: item.clubRole, status: item.status, canAnnounce: item.canAnnounce })));
}

module.exports = { list, get, create, patch, status, join, leave, members, patchMember, transfer, myMemberships };
