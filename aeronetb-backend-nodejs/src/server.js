const app = require('./app');
const config = require('./config/config');
const { initPostgres, closePostgres } = require('./database/postgresql');
const { initMongoDB, closeMongoDB } = require('./database/mongodb');

const PORT = config.port;
const HOST = config.host;

let server;

const startServer = async () => {
  try {
    // Initialize databases
    console.log('🔄 Initializing database connections...');
    await initPostgres();
    await initMongoDB();
    console.log('✅ All database connections established\n');
    
    // Start server
    server = app.listen(PORT, HOST, () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🚀 AeroNetB Aerospace API Server');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📡 Server running on: http://${HOST}:${PORT}`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`📚 API Base: http://${HOST}:${PORT}/api`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('Available endpoints:');
      console.log(`  • POST   /api/auth/login`);
      console.log(`  • GET    /api/auth/me`);
      console.log(`  • GET    /api/suppliers`);
      console.log(`  • POST   /api/suppliers`);
      console.log(`  • GET    /api/iot/devices`);
      console.log(`  • GET    /api/iot/devices/:deviceId/readings`);
      console.log(`  • POST   /api/iot/sensors/readings`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🔄 Received ${signal}. Shutting down gracefully...`);
  
  if (server) {
    server.close(async () => {
      console.log('✅ HTTP server closed');
      
      try {
        await closePostgres();
        await closeMongoDB();
        console.log('✅ All connections closed');
        console.log('👋 Goodbye!\n');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    });
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('⚠️  Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start the server
startServer();
