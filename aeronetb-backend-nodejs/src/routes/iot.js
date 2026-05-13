const express = require('express');
const router = express.Router();
const { getDB } = require('../database/mongodb');
const authenticate = require('../middleware/auth');

/**
 * GET /api/iot/devices
 * List all IoT devices
 */
router.get('/devices', authenticate, async (req, res) => {
  try {
    const { warehouse_id, status, device_type } = req.query;
    const db = getDB();
    
    // Build filter
    const filter = {};
    if (warehouse_id) filter['warehouse.warehouse_id'] = parseInt(warehouse_id);
    if (status) filter.status = status;
    if (device_type) filter.device_type = device_type;
    
    const devices = await db.collection('iot_devices')
      .find(filter)
      .sort({ device_name: 1 })
      .toArray();
    
    res.json({
      success: true,
      data: {
        count: devices.length,
        devices,
      },
    });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve devices',
      error: error.message,
    });
  }
});

/**
 * GET /api/iot/devices/:deviceId
 * Get device details
 */
router.get('/devices/:deviceId', authenticate, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const db = getDB();
    
    const device = await db.collection('iot_devices').findOne({
      device_id: deviceId,
    });
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
      });
    }
    
    res.json({
      success: true,
      data: device,
    });
  } catch (error) {
    console.error('Get device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve device',
      error: error.message,
    });
  }
});

/**
 * GET /api/iot/devices/:deviceId/readings
 * Get sensor readings for a device
 */
router.get('/devices/:deviceId/readings', authenticate, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { hours = 24, limit = 1000 } = req.query;
    
    const db = getDB();
    
    // Calculate time range
    const endTime = new Date();
    const startTime = new Date(endTime - hours * 60 * 60 * 1000);
    
    // Query MongoDB
    const readings = await db
      .collection('sensor_readings')
      .find({
        device_id: deviceId,
        timestamp: {
          $gte: startTime,
          $lte: endTime,
        },
      })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .toArray();
    
    if (readings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No readings found for device',
      });
    }
    
    // Calculate statistics
    const values = readings.map((r) => r.reading_value);
    const statistics = {
      avg_value: values.reduce((a, b) => a + b, 0) / values.length,
      min_value: Math.min(...values),
      max_value: Math.max(...values),
      alerts_triggered: readings.filter((r) => r.alert_triggered).length,
    };
    
    // Get device info
    const device = await db.collection('iot_devices').findOne({
      device_id: deviceId,
    });
    
    res.json({
      success: true,
      data: {
        device_id: deviceId,
        device_name: device?.device_name || null,
        reading_count: readings.length,
        time_range: {
          start: startTime.toISOString(),
          end: endTime.toISOString(),
        },
        readings: readings.map((r) => ({
          timestamp: r.timestamp,
          reading_value: r.reading_value,
          unit_of_measure: r.unit_of_measure,
          alert_triggered: r.alert_triggered || false,
        })),
        statistics,
      },
    });
  } catch (error) {
    console.error('Get readings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve readings',
      error: error.message,
    });
  }
});

/**
 * POST /api/iot/sensors/readings
 * Post new sensor reading (called by IoT devices)
 */
router.post('/sensors/readings', async (req, res) => {
  try {
    const readingData = req.body;
    
    // Validate required fields
    if (!readingData.device_id || !readingData.reading_value) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: device_id, reading_value',
      });
    }
    
    // Add timestamp
    readingData.timestamp = new Date();
    
    // Check thresholds and set alert flags
    const thresholds = readingData.thresholds || {};
    const value = readingData.reading_value;
    
    if (thresholds && value) {
      if (
        value < thresholds.critical_min ||
        value > thresholds.critical_max
      ) {
        readingData.alert_triggered = true;
        readingData.alert_severity = 'critical';
      } else if (
        value < thresholds.min ||
        value > thresholds.max
      ) {
        readingData.alert_triggered = true;
        readingData.alert_severity = 'warning';
      } else {
        readingData.alert_triggered = false;
        readingData.alert_severity = null;
      }
    }
    
    const db = getDB();
    
    // Insert reading
    const result = await db.collection('sensor_readings').insertOne(readingData);
    
    res.status(201).json({
      success: true,
      message: 'Reading recorded successfully',
      data: {
        reading_id: result.insertedId,
        alert_triggered: readingData.alert_triggered,
      },
    });
  } catch (error) {
    console.error('Post reading error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record reading',
      error: error.message,
    });
  }
});

/**
 * GET /api/iot/warehouse/:warehouseId/readings
 * Get all sensor readings for a warehouse
 */
router.get('/warehouse/:warehouseId/readings', authenticate, async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const { hours = 24 } = req.query;
    
    const db = getDB();
    
    // Calculate time range
    const endTime = new Date();
    const startTime = new Date(endTime - hours * 60 * 60 * 1000);
    
    const readings = await db
      .collection('sensor_readings')
      .find({
        warehouse_id: parseInt(warehouseId),
        timestamp: {
          $gte: startTime,
          $lte: endTime,
        },
      })
      .sort({ timestamp: -1 })
      .limit(1000)
      .toArray();
    
    // Group by device
    const deviceGroups = {};
    readings.forEach((r) => {
      if (!deviceGroups[r.device_id]) {
        deviceGroups[r.device_id] = [];
      }
      deviceGroups[r.device_id].push(r);
    });
    
    res.json({
      success: true,
      data: {
        warehouse_id: parseInt(warehouseId),
        time_range: {
          start: startTime.toISOString(),
          end: endTime.toISOString(),
        },
        total_readings: readings.length,
        devices: Object.keys(deviceGroups).length,
        readings_by_device: deviceGroups,
      },
    });
  } catch (error) {
    console.error('Get warehouse readings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve warehouse readings',
      error: error.message,
    });
  }
});

module.exports = router;
