const { supabase } = require('../config/supabase');

/**
 * Middleware to authenticate requests using Supabase Auth JWT Bearer token.
 * 
 * Verifies the token using supabase.auth.getUser(token) and attaches
 * the authenticated user object to req.user.
 */
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing or malformed Bearer token in Authorization header.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Token not provided.',
      });
    }

    // Verify the JWT token with Supabase Auth
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        error: error?.message || 'Unauthorized: Invalid or expired authentication token.',
      });
    }

    // Attach user information and token to request object
    req.user = data.user;
    req.token = token;

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authenticateUser;
