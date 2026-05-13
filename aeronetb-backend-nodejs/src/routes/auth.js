const express = require('express');
const router = express.Router();
const { getPool } = require('../database/postgresql');
const { comparePassword, generateToken } = require('../utils/security');
const authenticate = require('../middleware/auth');

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.',
      });
    }
    
    const pool = getPool();
    
    // Query user
    const query = `
      SELECT u.user_id, u.username, u.email, u.password_hash, 
             r.role_name, u.first_name, u.last_name
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE u.username = $1 AND u.is_active = TRUE
    `;
    
    const result = await pool.query(query, [username]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }
    
    // Generate token
    const token = generateToken({
      userId: user.user_id,
      username: user.username,
      role: user.role_name,
    });
    
    // Return success
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        access_token: token,
        token_type: 'Bearer',
        user: {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          role: user.role_name,
          full_name: `${user.first_name} ${user.last_name}`,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', authenticate, (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
});

/**
 * POST /api/auth/logout
 * User logout (token should be cleared on client side)
 */
router.post('/logout', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully. Please clear token on client side.',
  });
});

module.exports = router;
