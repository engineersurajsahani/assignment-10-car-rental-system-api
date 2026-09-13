const supabase = require('../config/supabase');
const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Authorization token required' });
    const token = header.split(' ')[1];
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return res.status(401).json({ error: 'Invalid or expired token' });
    req.user = data.user;
    next();
  } catch (error) { next(error); }
};
module.exports = auth;
