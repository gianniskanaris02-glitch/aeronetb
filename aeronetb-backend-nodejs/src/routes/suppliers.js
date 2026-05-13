const express = require('express');
const router = express.Router();
const { getPool } = require('../database/postgresql');
const authenticate = require('../middleware/auth');
const requireRoles = require('../middleware/rbac');

/**
 * GET /api/suppliers
 * List all suppliers with pagination
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, country } = req.query;
    const offset = (page - 1) * limit;
    
    const pool = getPool();
    
    // Build query with filters
    let whereClause = '';
    const params = [];
    let paramCount = 1;
    
    if (status) {
      whereClause += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (country) {
      whereClause += ` AND country = $${paramCount}`;
      params.push(country);
      paramCount++;
    }
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) FROM suppliers 
      WHERE 1=1 ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    // Get paginated results
    params.push(limit, offset);
    const dataQuery = `
      SELECT supplier_id, supplier_name, supplier_type, country, 
             status, performance_rating, contact_email, contact_phone
      FROM suppliers
      WHERE 1=1 ${whereClause}
      ORDER BY supplier_name
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const dataResult = await pool.query(dataQuery, params);
    
    res.json({
      success: true,
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        suppliers: dataResult.rows,
      },
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve suppliers',
      error: error.message,
    });
  }
});

/**
 * GET /api/suppliers/:id
 * Get supplier details
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    
    const query = `
      SELECT s.*, 
             COUNT(DISTINCT sp.supplier_part_id) as total_parts,
             COUNT(DISTINCT po.po_id) as total_orders
      FROM suppliers s
      LEFT JOIN supplier_parts sp ON s.supplier_id = sp.supplier_id
      LEFT JOIN purchase_orders po ON s.supplier_id = po.supplier_id
      WHERE s.supplier_id = $1
      GROUP BY s.supplier_id
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve supplier',
      error: error.message,
    });
  }
});

/**
 * POST /api/suppliers
 * Create new supplier
 */
router.post(
  '/',
  authenticate,
  requireRoles('Supply Chain Manager', 'Administrator'),
  async (req, res) => {
    try {
      const {
        supplier_name,
        supplier_type,
        country,
        contact_email,
        contact_phone,
        address,
      } = req.body;
      
      // Validate required fields
      if (!supplier_name || !supplier_type || !country || !contact_email) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: supplier_name, supplier_type, country, contact_email',
        });
      }
      
      const pool = getPool();
      
      const query = `
        INSERT INTO suppliers (
          supplier_name, supplier_type, country, contact_email, 
          contact_phone, address, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'Active')
        RETURNING supplier_id, supplier_name, status
      `;
      
      const result = await pool.query(query, [
        supplier_name,
        supplier_type,
        country,
        contact_email,
        contact_phone,
        address,
      ]);
      
      res.status(201).json({
        success: true,
        message: 'Supplier created successfully',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Create supplier error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create supplier',
        error: error.message,
      });
    }
  }
);

/**
 * PUT /api/suppliers/:id
 * Update supplier
 */
router.put(
  '/:id',
  authenticate,
  requireRoles('Supply Chain Manager', 'Administrator'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        supplier_name,
        supplier_type,
        country,
        contact_email,
        contact_phone,
        address,
        status,
      } = req.body;
      
      const pool = getPool();
      
      const query = `
        UPDATE suppliers
        SET supplier_name = COALESCE($1, supplier_name),
            supplier_type = COALESCE($2, supplier_type),
            country = COALESCE($3, country),
            contact_email = COALESCE($4, contact_email),
            contact_phone = COALESCE($5, contact_phone),
            address = COALESCE($6, address),
            status = COALESCE($7, status),
            updated_at = CURRENT_TIMESTAMP
        WHERE supplier_id = $8
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        supplier_name,
        supplier_type,
        country,
        contact_email,
        contact_phone,
        address,
        status,
        id,
      ]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found',
        });
      }
      
      res.json({
        success: true,
        message: 'Supplier updated successfully',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Update supplier error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update supplier',
        error: error.message,
      });
    }
  }
);

/**
 * DELETE /api/suppliers/:id
 * Delete supplier
 */
router.delete(
  '/:id',
  authenticate,
  requireRoles('Administrator'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const pool = getPool();
      
      const query = 'DELETE FROM suppliers WHERE supplier_id = $1 RETURNING supplier_id';
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found',
        });
      }
      
      res.json({
        success: true,
        message: 'Supplier deleted successfully',
      });
    } catch (error) {
      console.error('Delete supplier error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete supplier',
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/suppliers/:id/certifications
 * Get supplier certifications
 */
router.get('/:id/certifications', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    
    const query = `
      SELECT sc.*, c.certification_name, c.certification_body
      FROM supplier_certifications sc
      JOIN certifications c ON sc.certification_id = c.certification_id
      WHERE sc.supplier_id = $1
      ORDER BY sc.expiry_date DESC
    `;
    
    const result = await pool.query(query, [id]);
    
    res.json({
      success: true,
      data: {
        supplier_id: parseInt(id),
        certifications: result.rows,
      },
    });
  } catch (error) {
    console.error('Get certifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve certifications',
      error: error.message,
    });
  }
});

/**
 * GET /api/suppliers/:id/performance
 * Get supplier performance metrics
 */
router.get('/:id/performance', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    
    const query = `
      SELECT *
      FROM supplier_performance
      WHERE supplier_id = $1
      ORDER BY evaluation_date DESC
      LIMIT 10
    `;
    
    const result = await pool.query(query, [id]);
    
    res.json({
      success: true,
      data: {
        supplier_id: parseInt(id),
        performance_records: result.rows,
      },
    });
  } catch (error) {
    console.error('Get performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve performance data',
      error: error.message,
    });
  }
});

module.exports = router;
