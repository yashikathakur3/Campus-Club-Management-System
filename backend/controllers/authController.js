const authService = require('../services/authService');
const { sendSuccess } = require('../utils/response');

async function register(req, res) {
  return sendSuccess(res, await authService.register(req.body), { status: 201 });
}

async function login(req, res) {
  return sendSuccess(res, await authService.login(req.body));
}

async function getMe(req, res) {
  return sendSuccess(res, await authService.getCurrentUser(req.user.id));
}

async function patchMe(req, res) {
  const user = await authService.updateProfile(req.user.id, req.body);
  return sendSuccess(res, { user });
}

async function patchPassword(req, res) {
  return sendSuccess(res, await authService.changePassword(req.user.id, req.body));
}

module.exports = { register, login, getMe, patchMe, patchPassword };
