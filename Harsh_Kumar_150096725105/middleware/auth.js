const supabase = require('../config/supabase');

module.exports = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user; // Attach Supabase user to request
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
