const supabase = require('../config/supabase');

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Unauthorized', error: error?.message });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error during authentication' });
  }
};

module.exports = auth;
