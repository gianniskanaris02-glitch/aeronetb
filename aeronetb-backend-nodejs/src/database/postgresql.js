const { Pool } = require('pg');
const config = require('../config/config');

let pool = null;

const initPostgres = async () => {
  try {
    // Use DATABASE_URL if provided (Render provides this automatically)
    const poolConfig = process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: {
            rejectUnauthorized: false, // Required for Render PostgreSQL
          },
        }
      : {
          ...config.postgres,
          ssl: process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false,
        };

    pool = new Pool(poolConfig);

    // Test connection
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected:', config.postgres.database);
    client.release();

    return pool;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    throw error;
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('PostgreSQL pool not initialized. Call initPostgres() first.');
  }
  return pool;
};

const closePostgres = async () => {
  if (pool) {
    await pool.end();
    console.log('✅ PostgreSQL connection pool closed');
  }
};

module.exports = {
  initPostgres,
  getPool,
  closePostgres,
};