const { validateEnv } = require('./config/env');

async function startServer() {
  let config;
  try {
    config = validateEnv();
  } catch (error) {
    console.error(`Environment configuration error: ${error.message}`);
    process.exit(1);
  }

  try {
    const connectDB = require('./config/db');
    await connectDB(config.MONGO_URI);
    const app = require('./app');
    const server = app.listen(Number(config.PORT), () => {
      console.log(`Server listening on port ${config.PORT}`);
    });
    return server;
  } catch {
    console.error('Server startup failed: MongoDB connection could not be established.');
    process.exit(1);
  }
}

if (require.main === module) startServer();
module.exports = startServer;
