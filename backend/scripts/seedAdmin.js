const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { BCRYPT_ROUNDS } = require('../services/authService');

function assertStrongPassword(password) {
  const strong = typeof password === 'string'
    && password.length >= 16
    && /[A-Za-z]/.test(password)
    && /[0-9]/.test(password)
    && /[^A-Za-z0-9]/.test(password);
  if (!strong) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 16 characters and include a letter, number, and symbol.');
  }
}

async function seedAdmin({ email, password }) {
  if (!email || !String(email).trim()) throw new Error('SEED_ADMIN_EMAIL is required.');
  assertStrongPassword(password);

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    if (existing.role !== 'super_admin') {
      throw new Error('The configured seed email belongs to a non-admin account; refusing to change its role.');
    }
    return { created: false, user: existing };
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({
    name: 'Super Admin',
    email: normalizedEmail,
    passwordHash,
    role: 'super_admin',
  });
  return { created: true, user };
}

async function runSeedCommand() {
  let connected = false;
  try {
    const { validateEnv } = require('../config/env');
    const config = validateEnv();
    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    const missing = [];
    if (!email || !email.trim()) missing.push('SEED_ADMIN_EMAIL');
    if (!password || !password.trim()) missing.push('SEED_ADMIN_PASSWORD');
    if (missing.length) throw new Error(`Missing required environment variable${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`);
    assertStrongPassword(password);

    const connectDB = require('../config/db');
    await connectDB(config.MONGO_URI);
    connected = true;
    const result = await seedAdmin({ email, password });
    console.log(result.created ? 'Super Admin account created.' : 'Super Admin account already exists; no changes made.');
  } catch (error) {
    console.error(`Admin seeding failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    if (connected) await require('mongoose').disconnect();
  }
}

if (require.main === module) runSeedCommand();

module.exports = { assertStrongPassword, seedAdmin, runSeedCommand };
