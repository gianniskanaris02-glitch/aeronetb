const { verifyToken } = require('../utils/security');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authentication required.',
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer '
    
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
      });
    }
    
    // Attach user to request
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    };
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed.',
      error: error.message,
    });
  }
};

module.exports = authenticate;
