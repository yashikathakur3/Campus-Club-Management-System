const { assertClubRole } = require('../services/clubAccessService');
const Club = require('../models/Club');
const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

function requireClubRole(...allowedClubRoles) {
  return async (req, res, next) => {
    try {
      if (!req.user) throw new ApiError(401, 'UNAUTHENTICATED', 'Authentication is required or the token is invalid');
      const club = mongoose.isValidObjectId(req.params.id)
        ? await Club.findById(req.params.id).select('_id')
        : await Club.findOne({ slug: req.params.id }).select('_id');
      if (!club) throw new ApiError(404, 'NOT_FOUND', 'Club not found');
      req.club = club;
      await assertClubRole(req.user, club._id, allowedClubRoles);
      return next();
    } catch (error) { return next(error); }
  };
}

module.exports = requireClubRole;
