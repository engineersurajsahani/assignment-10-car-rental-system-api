// middleware/auth.js
const supabase = require('../config/supabase');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }

    req.user = data.user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token verification failed' });
  }
};

module.exports = { protect };