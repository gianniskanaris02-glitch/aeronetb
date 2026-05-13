require('dotenv').config();

module.exports = {
  // Server
  port: process.env.PORT || 8000,
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // PostgreSQL
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT) || 5432,
    user: process.env.POSTGRES_USER || 'aeronetb_user',
    password: process.env.POSTGRES_PASSWORD || '',
    database: process.env.POSTGRES_DB || 'aeronetb_db',
    max: 20, // connection pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  
  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    database: process.env.MONGODB_DB || 'aeronetb_mongo',
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
    expiresIn: process.env.JWT_EXPIRE || '30m',
  },
  
  // CORS
  cors: {
    origins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  },
};
