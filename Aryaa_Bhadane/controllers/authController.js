const { supabase } = require('../config/supabase');

/**
 * @desc    Register a new customer with Supabase Auth
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Validate mandatory input fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.',
      });
    }

    // Register user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || '',
        },
      },
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        user: data.user,
        session: data.session,
        token: data.session?.access_token || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Login customer and receive Supabase access token (JWT)
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate mandatory input fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and password.',
      });
    }

    // Sign in using Supabase Auth password grant
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({
        success: false,
        error: error.message || 'Invalid email or password credentials.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token: data.session?.access_token,
      data: {
        user: data.user,
        session: data.session,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
};
