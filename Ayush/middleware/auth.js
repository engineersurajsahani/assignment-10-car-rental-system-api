const { supabase, getClientForToken } = require('../config/supabase');

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({
        success: false,
        message: 'Missing or malformed Authorization header. Expected: Bearer <token>',
      });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    req.user = data.user;
    req.accessToken = token;
    req.supabase = getClientForToken(token);

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth };
