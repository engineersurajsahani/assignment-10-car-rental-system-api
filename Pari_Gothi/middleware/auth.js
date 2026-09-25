const supabase = require('../config/supabase');

/**
 * Route Guard Middleware
 * Verifies the Supabase JWT Bearer token and attaches authenticated user to req.user
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required. Bearer token missing from Authorization header.'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Invalid authorization format. Bearer token expected.'
      });
    }

    // Validate the token against Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: error ? error.message : 'Invalid or expired authentication token.'
      });
    }

    // Attach authenticated user info to request object
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = requireAuth;
