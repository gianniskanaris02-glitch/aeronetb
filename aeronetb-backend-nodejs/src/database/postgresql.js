const { Pool } = require('pg');

let pool = null;

const initPostgres = async () => {
  try {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }

    console.log('🔄 Connecting to PostgreSQL...');

    // Check if using internal Render URL
    const isInternal = connectionString.includes('.internal');
    const isExternal = connectionString.includes('render.com');

    let sslConfig;
    if (isInternal) {
      // Internal Render connections don't need SSL
      sslConfig = false;
    } else if (isExternal) {
      // External connections need SSL but no certificate verification
      sslConfig = { rejectUnauthorized: false };
    } else {
      sslConfig = false;
    }

    pool = new Pool({
      connectionString,
      ssl: sslConfig,
      connectionTimeoutMillis: 30000,
      idleTimeoutMillis: 60000,
      max: 5,
    });

    pool.on('error', (err) => {
      console.error('Pool error:', err.message);
    });

    // Test with retry
    let retries = 3;
    while (retries > 0) {
      try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        console.log('✅ PostgreSQL connected successfully');
        return pool;
      } catch (err) {
        retries--;
        console.log(`⚠️ Retry... attempts left: ${retries}`);
        if (retries === 0) throw err;
        await new Promise(r => setTimeout(r, 3000));
      }
    }

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