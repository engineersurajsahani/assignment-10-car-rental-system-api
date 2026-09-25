const supabase = require('../config/supabase');

/**
 * Register a new user with Supabase Auth
 * POST /api/auth/register
 * Body: { email, password, name }
 */
const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password should be at least 6 characters long.'
      });
    }

    // Call Supabase Auth signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0]
        }
      }
    });

    if (error) {
      return res.status(400).json({
        error: error.message
      });
    }

    return res.status(201).json({
      message: 'Registration successful.',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        user_metadata: data.user?.user_metadata
      },
      session: data.session
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Login user with Supabase Auth
 * POST /api/auth/login
 * Body: { email, password }
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required.'
      });
    }

    // Authenticate with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({
        error: error.message
      });
    }

    return res.status(200).json({
      message: 'Login successful.',
      access_token: data.session?.access_token,
      token_type: 'Bearer',
      expires_in: data.session?.expires_in,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        user_metadata: data.user?.user_metadata
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login
};
