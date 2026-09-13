const supabase = require('../config/supabase');
const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'email, password and name are required' });
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ message: 'Registration successful', user: data.user, session: data.session });
  } catch (error) { next(error); }
};
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: error.message });
    res.status(200).json({ message: 'Login successful', user: data.user, access_token: data.session.access_token, refresh_token: data.session.refresh_token });
  } catch (error) { next(error); }
};
module.exports = { register, login };
