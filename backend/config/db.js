const mongoose = require('mongoose');

let memoryServer;

async function connectDB() {
  let uri = process.env.MONGODB_URI;
  if (!uri) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGODB_URI is required in production.');
    }
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
    console.log('MONGODB_URI is empty. Using an in-memory database that resets when the API stops.');
  }
  await mongoose.connect(uri);
  console.log('MongoDB connected.');
}

module.exports = { connectDB };
