const User = require('../models/User');
const ApiError = require('../utils/ApiError');

let adminMutationQueue = Promise.resolve();
function serializeAdminMutation(operation) {
  const result = adminMutationQueue.then(operation, operation);
  adminMutationQueue = result.catch(() => {});
  return result;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function listUsers({ page, limit, q, role, isActive, sort, order }) {
  const filter = {};
  if (q) {
    const expression = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: expression }, { email: expression }, { studentId: expression }];
  }
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive;
  const [users, total] = await Promise.all([
    User.find(filter).sort({ [sort]: order === 'asc' ? 1 : -1, _id: 1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  return { users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getUser(id) {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found');
  return user;
}

async function updateUser(actorId, id, changes) {
  if (String(actorId) === String(id) && (changes.role !== undefined || changes.isActive === false)) {
    throw new ApiError(400, 'SELF_MODIFICATION_FORBIDDEN', 'You cannot change your own role or deactivate yourself');
  }

  const performUpdate = async () => {
    const user = await User.findById(id).select('+tokenVersion');
    if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found');
    const removesActiveAdmin = user.role === 'super_admin' && user.isActive &&
      ((changes.role !== undefined && changes.role !== 'super_admin') || changes.isActive === false);
    if (removesActiveAdmin) {
      const activeAdmins = await User.countDocuments({ role: 'super_admin', isActive: true });
      if (activeAdmins <= 1) throw new ApiError(409, 'LAST_SUPER_ADMIN', 'The last active super admin cannot be demoted or deactivated');
    }
    const changed = (changes.role !== undefined && changes.role !== user.role) ||
      (changes.isActive !== undefined && changes.isActive !== user.isActive);
    Object.assign(user, changes);
    if (changed) user.tokenVersion += 1;
    await user.save();
    return user;
  };

  return serializeAdminMutation(performUpdate);
}

module.exports = { listUsers, getUser, updateUser, escapeRegex };
