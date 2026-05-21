const { Pool } = require('pg');

let pool = null;

const initPostgres = async () => {
  try {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }

    console.log('🔄 Connecting to PostgreSQL...');

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined,
      },
      connectionTimeoutMillis: 30000,
      idleTimeoutMillis: 60000,
      max: 5,
    });

    pool.on('error', (err) => {
      console.error('Pool error:', err.message);
    });

    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ PostgreSQL connected successfully');
    return pool;

  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    throw error;
  }
};

const getPool = () => {
  if (!pool) throw new Error('PostgreSQL not initialized');
  return pool;
};

const closePostgres = async () => {
  if (pool) {
    await pool.end();
    console.log('✅ PostgreSQL closed');
  }
};

module.exports = { initPostgres, getPool, closePostgres };