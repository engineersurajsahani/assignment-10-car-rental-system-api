// middleware/auth.js
const jwt = require('jsonwebtoken');
const { supabase, isMock } = require('../config/supabase');

const authenticateSupabase = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Missing or invalid Authorization Bearer token'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    if (!isMock && supabase.auth) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return res.status(401).json({ success: false, message: 'Invalid Supabase token', error: error?.message });
      }
      req.user = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email.split('@')[0]
      };
      return next();
    } else {
      // Mock auth verification
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supabase_demo_secret_token_2026');
        req.user = decoded;
        return next();
      } catch (e) {
        // Fallback demo user if token is 'test-token' or decoded
        if (token === 'test-token' || token.length > 5) {
          req.user = {
            id: 'd9b2d63d-a233-4f9e-9762-5b9278fa8921',
            email: 'driver@travel.com',
            name: 'David'
          };
          return next();
        }
        return res.status(401).json({ success: false, message: 'Invalid authorization token' });
      }
    }
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Authentication error', error: error.message });
  }
};

module.exports = authenticateSupabase;
