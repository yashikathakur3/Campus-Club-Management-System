const jwt = require('jsonwebtoken');
const { env, validateEnv } = require('../config/env');

function getConfig() {
  return env || validateEnv();
}

function signAccessToken(user) {
  const config = getConfig();
  return jwt.sign(
    { sub: String(user._id || user.id), tv: user.tokenVersion },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN },
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, getConfig().JWT_SECRET);
}

module.exports = { signAccessToken, verifyAccessToken };
