const userService = require('../services/userService');
const { sendSuccess } = require('../utils/response');

async function list(req, res) {
  const result = await userService.listUsers(req.query);
  return sendSuccess(res, result.users, { meta: result.meta });
}
async function get(req, res) {
  return sendSuccess(res, { user: await userService.getUser(req.params.id) });
}
async function patch(req, res) {
  const user = await userService.updateUser(req.user.id, req.params.id, req.body);
  return sendSuccess(res, { user });
}

module.exports = { list, get, patch };
