const express = require('express');
const router = express.Router();
const { getPool } = require('../database/postgresql');
const { getDB } = require('../database/mongodb');
const authenticate = require('../middleware/auth');

// GET /api/dashboard/kpis - Get Key Performance Indicators
router.get('/kpis', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const db = getDB();
    
    // Procurement KPIs
    const procurementQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE po_status = 'Approved') as active_orders,
        COUNT(*) FILTER (WHERE po_status = 'Draft') as pending_approvals,
        COALESCE(SUM(total_amount) FILTER (WHERE po_status IN ('Approved', 'In Transit')), 0) as total_value
      FROM purchase_orders
    `;
    const procurementResult = await pool.query(procurementQuery);
    
    // Inventory KPIs
    const inventoryQuery = `
      SELECT 
        COUNT(DISTINCT part_id) as total_parts,
        COUNT(*) FILTER (WHERE quantity_available <= reorder_level) as low_stock_items,
        COUNT(*) FILTER (WHERE quantity_available = 0) as out_of_stock
      FROM inventory
    `;
    const inventoryResult = await pool.query(inventoryQuery);
    
    // Quality KPIs
    const qualityQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE inspection_status = 'Pending') as pending_inspections,
        COUNT(*) FILTER (WHERE inspection_status = 'Fail' AND inspection_date >= CURRENT_DATE - INTERVAL '30 days') as failed_inspections_this_month,
        COALESCE(AVG(conformance_percentage) FILTER (WHERE inspection_date >= CURRENT_DATE - INTERVAL '30 days'), 0) as average_conformance
      FROM quality_inspections
    `;
    const qualityResult = await pool.query(qualityQuery);
    
    // IoT KPIs (from MongoDB)
    const activeDevices = await db.collection('iot_devices').countDocuments({ status: 'active' });
    const activeAlerts = await db.collection('alerts').countDocuments({ status: 'active' });
    const criticalAlerts = await db.collection('alerts').countDocuments({ 
      status: 'active',
      severity: 'critical',
    });
    
    // Supplier KPIs
    const supplierQuery = `
      SELECT 
        COUNT(*) as total_suppliers,
        COUNT(*) FILTER (WHERE status = 'Active') as active_suppliers,
        COALESCE(AVG(performance_rating), 0) as average_rating
      FROM suppliers
    `;
    const supplierResult = await pool.query(supplierQuery);
    
    res.json({
      success: true,
      data: {
        procurement: procurementResult.rows[0],
        inventory: inventoryResult.rows[0],
        quality: qualityResult.rows[0],
        iot: {
          active_devices: activeDevices,
          active_alerts: activeAlerts,
          critical_alerts: criticalAlerts,
        },
        suppliers: supplierResult.rows[0],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;