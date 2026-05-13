const { MongoClient } = require('mongodb');
const config = require('../config/config');

let client = null;
let database = null;

const initMongoDB = async () => {
  try {
    client = new MongoClient(config.mongodb.uri);
    await client.connect();
    database = client.db(config.mongodb.database);
    
    // Test connection
    await database.command({ ping: 1 });
    console.log('✅ MongoDB connected:', config.mongodb.database);
    
    return database;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
};

const getDB = () => {
  if (!database) {
    throw new Error('MongoDB not initialized. Call initMongoDB() first.');
  }
  return database;
};

const closeMongoDB = async () => {
  if (client) {
    await client.close();
    console.log('✅ MongoDB connection closed');
  }
};

module.exports = {
  initMongoDB,
  getDB,
  closeMongoDB,
};
