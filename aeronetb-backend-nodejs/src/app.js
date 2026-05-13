const express = require('express');
const cors = require('cors');
const config = require('./config/config');

// Import routes
const authRoutes = require('./routes/auth');
const supplierRoutes = require('./routes/suppliers');
const iotRoutes = require('./routes/iot');
// TODO: Import other routes as you create them
// const partRoutes = require('./routes/parts');
// const orderRoutes = require('./routes/orders');
// const inventoryRoutes = require('./routes/inventory');
// const qualityRoutes = require('./routes/quality');
// const alertRoutes = require('./routes/alerts');
// const dashboardRoutes = require('./routes/dashboard');

const app = express();

// Middleware
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/iot', iotRoutes);

// TODO: Add other routes as you create them
// app.use('/api/parts', partRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/inventory', inventoryRoutes);
// app.use('/api/quality', qualityRoutes);
// app.use('/api/alerts', alertRoutes);
// app.use('/api/dashboard', dashboardRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AeroNetB Aerospace API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      authentication: '/api/auth',
      suppliers: '/api/suppliers',
      iot: '/api/iot',
      health: '/health',
    },
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: config.nodeEnv === 'development' ? err.stack : undefined,
  });
});

module.exports = app;
