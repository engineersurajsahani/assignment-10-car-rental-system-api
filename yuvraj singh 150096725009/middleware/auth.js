const supabase = require('../config/supabase');

/**
 * Authentication Middleware
 * 
 * Verifies JWT access token using Supabase Auth.
 * Expects header: "Authorization: Bearer <access_token>"
 * Attaches the authenticated user object to `req.user`.
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authorization token provided. Format: Bearer <token>'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Malformed authorization token.'
      });
    }

    // Verify token with Supabase Auth using isolated verification
    const { data: { user } = {}, error } = typeof supabase.verifyToken === 'function'
      ? await supabase.verifyToken(token)
      : await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: error ? error.message : 'Invalid or expired authorization token'
      });
    }

    // Attach authenticated user to request
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = requireAuth;
