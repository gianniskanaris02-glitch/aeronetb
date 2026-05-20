const app = require('./app');
const { initPostgres, closePostgres } = require('./database/postgresql');
const { initMongoDB, closeMongoDB } = require('./database/mongodb');

const PORT = process.env.PORT || 8000;

let server;

const startServer = async () => {
  try {
    console.log('🔄 Starting AeroNetB server...');
    console.log('🔄 NODE_ENV:', process.env.NODE_ENV);
    console.log('🔄 DATABASE_URL exists:', !!process.env.DATABASE_URL);

    // Connect PostgreSQL
    await initPostgres();

    // Connect MongoDB (optional)
    await initMongoDB();

    // Start HTTP server
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🚀 AeroNetB API is LIVE');
      console.log(`📡 Port: ${PORT}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });

  } catch (error) {
    console.error('❌ Server failed to start:', error.message);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  if (server) server.close();
  await closePostgres();
  await closeMongoDB();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down...');
  if (server) server.close();
  await closePostgres();
  await closeMongoDB();
  process.exit(0);
});

startServer();
