const { supabase } = require('../config/supabase');

/**
 * Middleware to verify Supabase JWT Bearer token
 * Extracts token from Authorization: Bearer <token>
 * Uses supabase.auth.getUser(token) to authenticate user
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Missing or malformed Bearer token in Authorization header.'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token not found after Bearer prefix.'
      });
    }

    // Validate token with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: error ? error.message : 'Invalid or expired Supabase authentication token.'
      });
    }

    // Attach user information to the request
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Error in Supabase Auth Middleware:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed due to an unexpected token validation error.'
    });
  }
};

module.exports = { requireAuth };
