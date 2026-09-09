const supabase = require('../config/supabase');

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access. Authorization header with Bearer token is required.'
      });
    }

    const token = authHeader.split(' ')[1];

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data || !data.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access. Invalid or expired token.'
      });
    }

    req.user = data.user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access.',
      error: err.message
    });
  }
};

module.exports = authenticateUser;
