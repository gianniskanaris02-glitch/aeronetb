const { MongoClient } = require('mongodb');

let client = null;
let database = null;

const initMongoDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || 'aeronetb_mongo';

    if (!uri || uri === 'mongodb://localhost:27017') {
      console.log('⚠️  MongoDB URI not configured - skipping MongoDB connection');
      return;
    }

    client = new MongoClient(uri);
    await client.connect();
    database = client.db(dbName);
    await database.command({ ping: 1 });
    console.log('✅ MongoDB connected:', dbName);
    return database;
  } catch (error) {
    console.warn('⚠️  MongoDB not available:', error.message);
    // Don't throw - server continues without MongoDB
  }
};

const getDB = () => {
  if (!database) {
    throw new Error('MongoDB not initialized');
  }
  return database;
};

const closeMongoDB = async () => {
  if (client) {
    await client.close();
    console.log('✅ MongoDB connection closed');
  }
};

module.exports = { initMongoDB, getDB, closeMongoDB };
