const path = require('node:path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath, quiet: true });
let jwtSecretWarningIssued = false;

function validateEnv(source = process.env) {
  const missing = ['MONGO_URI', 'JWT_SECRET'].filter((key) => !source[key] || !String(source[key]).trim());
  if (missing.length) {
    throw new Error(`Missing required environment variable${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`);
  }

  if ((source.NODE_ENV || 'development') === 'production'
    && String(source.JWT_SECRET).length < 32
    && !jwtSecretWarningIssued) {
    console.warn('JWT_SECRET should be at least 32 characters in production.');
    jwtSecretWarningIssued = true;
  }

  return {
    ...source,
    PORT: source.PORT || '5000',
    NODE_ENV: source.NODE_ENV || 'development',
    CLIENT_ORIGIN: source.CLIENT_ORIGIN || 'http://localhost:5173',
    JWT_EXPIRES_IN: source.JWT_EXPIRES_IN || '7d',
  };
}

let env;
try {
  env = validateEnv();
} catch (error) {
  // Keep module imports testable; server.js handles startup failure and exit.
  env = null;
}

module.exports = { env, envPath, validateEnv };
