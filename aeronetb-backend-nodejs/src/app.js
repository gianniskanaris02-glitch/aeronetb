const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');

const authRoutes = require('./routes/auth');
const supplierRoutes = require('./routes/suppliers');
const iotRoutes = require('./routes/iot');
const setupRoutes = require('./routes/setup');

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files FIRST
app.use(express.static(path.join(__dirname, '../public')));

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/iot', iotRoutes);
app.use('/api/setup', setupRoutes);

// Root redirect to login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'Endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

module.exports = app;

