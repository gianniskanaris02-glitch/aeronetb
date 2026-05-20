const { Pool } = require('pg');

let pool = null;

const initPostgres = async () => {
  try {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 10,
    });

    // Test connection
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully');
    client.release();

    return pool;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    throw error;
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('PostgreSQL pool not initialized');
  }
  return pool;
};

const closePostgres = async () => {
  if (pool) {
    await pool.end();
    console.log('✅ PostgreSQL connection closed');
  }
};

module.exports = { initPostgres, getPool, closePostgres };