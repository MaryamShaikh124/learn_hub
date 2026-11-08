
const mongoose = require('mongoose');
const { removeLegacyCourseUniqueIndexes } = require('../utils/checkoutIndexMigration');

let memoryServer;
let connectionPromise = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = (async () => {
      let uri = process.env.MONGODB_URI;

      if (!uri) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('MONGODB_URI is required in production.');
        }

        const { MongoMemoryServer } = require('mongodb-memory-server');

        memoryServer = await MongoMemoryServer.create();
        uri = memoryServer.getUri();

        console.log('Using temporary in-memory MongoDB.');
      }

      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000
      });

      await removeLegacyCourseUniqueIndexes();

      console.log('MongoDB connected.');

      return mongoose.connection;
    })().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  return connectionPromise;
}

module.exports = { connectDB };
