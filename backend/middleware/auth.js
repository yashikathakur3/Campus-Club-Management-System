const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/token');
const User = require('../models/User');
const mongoose = require('mongoose');

function unauthorized() {
  return new ApiError(401, 'UNAUTHENTICATED', 'Authentication is required or the token is invalid');
}

async function loadUserFromRequest(req) {
  const header = req.get('authorization');
  const match = typeof header === 'string' && /^Bearer\s+(.+)$/i.exec(header);
  if (!match) throw unauthorized();

  let payload;
  try {
    payload = verifyAccessToken(match[1]);
  } catch {
    throw unauthorized();
  }
  if (!payload || typeof payload.sub !== 'string' || !mongoose.isValidObjectId(payload.sub) || !Number.isInteger(payload.tv)) {
    throw unauthorized();
  }

  const user = await User.findById(payload.sub);
  if (!user || user.tokenVersion !== payload.tv) throw unauthorized();
  if (!user.isActive) throw new ApiError(403, 'ACCOUNT_DISABLED', 'This account is disabled');
  return user;
}

async function authenticate(req, res, next) {
  try {
    req.user = await loadUserFromRequest(req);
    return next();
  } catch (error) {
    return next(error);
  }
}

async function optionalAuth(req, res, next) {
  try {
    req.user = await loadUserFromRequest(req);
  } catch {
    // Public routes continue without an authenticated user.
  }
  return next();
}

module.exports = { authenticate, optionalAuth };
