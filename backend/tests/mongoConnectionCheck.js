const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const connectDB = require('../config/db');

async function main() {
  const mongo = await MongoMemoryServer.create({ instance: { dbName: 'campus_club_db' } });
  try {
    await connectDB(mongo.getUri('campus_club_db'));
    if (mongoose.connection.readyState !== 1 || mongoose.connection.name !== 'campus_club_db') {
      throw new Error('Mongoose did not connect to the expected database');
    }
    console.log(`Memory database connection verified: ${mongoose.connection.name}`);
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
