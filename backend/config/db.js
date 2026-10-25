const mongoose = require('mongoose');
const { env, validateEnv } = require('./env');

async function connectDB(uri = (env || validateEnv()).MONGO_URI) {
  await mongoose.connect(uri);
  const address = mongoose.connection.host;
  const database = mongoose.connection.name;
  console.log(`MongoDB connected: ${address}/${database}`);
  return mongoose.connection;
}

mongoose.connection.on('error', (error) => {
  console.error(`MongoDB connection error: ${error.message}`);
});
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

module.exports = connectDB;
