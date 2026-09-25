const { supabase } = require('../config/supabase');

async function register(req, res) {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'email and password are required',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'password must be at least 6 characters long',
    });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: name || null },
    },
  });

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  return res.status(201).json({
    success: true,
    message:
      'Registration successful. If email confirmation is enabled on your Supabase project, ' +
      'check your inbox before logging in.',
    data: {
      user: data.user,
      session: data.session,
    },
  });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'email and password are required',
    });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return res.status(401).json({ success: false, message: error.message });
  }

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: data.user,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
  });
}

module.exports = { register, login };
