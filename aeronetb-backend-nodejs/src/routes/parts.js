const express = require('express');
const router = express.Router();
const { getPool } = require('../database/postgresql');
const { getDB } = require('../database/mongodb');
const authenticate = require('../middleware/auth');
const requireRoles = require('../middleware/rbac');

// GET /api/parts - List all parts
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, criticality } = req.query;
    const offset = (page - 1) * limit;
    const pool = getPool();
    
    let whereClause = '';
    const params = [];
    let paramCount = 1;
    
    if (category) {
      whereClause += ` AND part_category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }
    
    if (criticality) {
      whereClause += ` AND criticality_level = $${paramCount}`;
      params.push(criticality);
      paramCount++;
    }
    
    const countQuery = `SELECT COUNT(*) FROM parts WHERE 1=1 ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    params.push(limit, offset);
    const dataQuery = `
      SELECT part_id, part_number, part_name, part_category, 
             criticality_level, unit_cost, material_type
      FROM parts
      WHERE 1=1 ${whereClause}
      ORDER BY part_name
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const dataResult = await pool.query(dataQuery, params);
    
    res.json({
      success: true,
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        parts: dataResult.rows,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/parts/:id/specifications - Get part specs from MongoDB
router.get('/:id/specifications', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    
    const spec = await db.collection('part_specifications').findOne({
      part_id: parseInt(id),
    });
    
    if (!spec) {
      return res.status(404).json({
        success: false,
        message: 'Specifications not found',
      });
    }
    
    res.json({ success: true, data: spec });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;