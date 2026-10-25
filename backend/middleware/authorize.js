const ApiError = require('../utils/ApiError');

function requireSuperAdmin(req, res, next) {
  if (!req.user) return next(new ApiError(401, 'UNAUTHENTICATED', 'Authentication is required or the token is invalid'));
  if (req.user.role !== 'super_admin') return next(new ApiError(403, 'FORBIDDEN', 'Super admin access is required'));
  return next();
}

function requireRoles(...globalRoles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'UNAUTHENTICATED', 'Authentication is required or the token is invalid'));
    if (!globalRoles.includes(req.user.role)) return next(new ApiError(403, 'FORBIDDEN', 'You do not have access to this resource'));
    return next();
  };
}

module.exports = { requireSuperAdmin, requireRoles };
