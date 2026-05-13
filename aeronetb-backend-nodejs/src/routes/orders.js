const express = require('express');
const router = express.Router();
const { getPool } = require('../database/postgresql');
const authenticate = require('../middleware/auth');
const requireRoles = require('../middleware/rbac');

// GET /api/orders - List orders
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, supplier_id } = req.query;
    const pool = getPool();
    
    let whereClause = '';
    const params = [];
    let paramCount = 1;
    
    if (status) {
      whereClause += ` AND po_status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (supplier_id) {
      whereClause += ` AND supplier_id = $${paramCount}`;
      params.push(supplier_id);
      paramCount++;
    }
    
    const query = `
      SELECT po.*, s.supplier_name
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.supplier_id
      WHERE 1=1 ${whereClause}
      ORDER BY po.order_date DESC
    `;
    
    const result = await pool.query(query, params);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/orders - Create order
router.post('/', authenticate, requireRoles('Procurement Officer', 'Administrator'), async (req, res) => {
  try {
    const {
      supplier_id,
      expected_delivery_date,
      payment_terms,
      line_items,
    } = req.body;
    
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Generate PO number
      const poNumberQuery = `
        SELECT 'PO-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || 
        LPAD((COUNT(*) + 1)::TEXT, 4, '0') as po_number
        FROM purchase_orders
        WHERE EXTRACT(YEAR FROM order_date) = EXTRACT(YEAR FROM CURRENT_DATE)
      `;
      const poNumberResult = await client.query(poNumberQuery);
      const po_number = poNumberResult.rows[0].po_number;
      
      // Calculate total
      const total = line_items.reduce((sum, item) => 
        sum + (item.quantity * item.unit_price), 0
      );
      
      // Insert PO
      const poQuery = `
        INSERT INTO purchase_orders (
          po_number, supplier_id, expected_delivery_date, 
          payment_terms, total_amount, created_by, po_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'Draft')
        RETURNING *
      `;
      const poResult = await client.query(poQuery, [
        po_number,
        supplier_id,
        expected_delivery_date,
        payment_terms,
        total,
        req.user.userId,
      ]);
      
      const po_id = poResult.rows[0].po_id;
      
      // Insert line items
      for (const item of line_items) {
        await client.query(
          `INSERT INTO order_line_items (po_id, part_id, quantity_ordered, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [po_id, item.part_id, item.quantity, item.unit_price]
        );
      }
      
      await client.query('COMMIT');
      
      res.status(201).json({
        success: true,
        message: 'Purchase order created',
        data: poResult.rows[0],
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;