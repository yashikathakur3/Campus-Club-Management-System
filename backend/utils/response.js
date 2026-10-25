function sendSuccess(res, data, { status = 200, meta } = {}) {
  const response = { success: true, data };
  if (meta !== undefined) response.meta = meta;
  return res.status(status).json(response);
}

module.exports = { sendSuccess };
