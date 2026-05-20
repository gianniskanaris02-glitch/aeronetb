const express = require('express');
const cors = require('cors');
const config = require('./config/config');

// Import routes
const authRoutes = require('./routes/auth');
const supplierRoutes = require('./routes/suppliers');
const iotRoutes = require('./routes/iot');
const setupRoutes = require('./routes/setup'); // REMOVE AFTER SETUP

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/iot', iotRoutes);
app.use('/api/setup', setupRoutes); // REMOVE AFTER SETUP

// Root
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
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

module.exports = app;

