const supabase = require('../config/supabase');
const { authClient } = require('../config/supabase');

/**
 * Register a new user
 * Route: POST /api/auth/register
 * Access: Public
 */
const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide customer name'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    let user;

    // If service role key is active, use admin.createUser with email_confirm: true for instant login availability
    if (supabase.auth && supabase.auth.admin) {
      const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: {
          name: name.trim()
        }
      });

      if (!adminError && adminData?.user) {
        user = adminData.user;
      } else if (adminError && !adminError.message.includes('not authorized')) {
        // Return duplicate email error or other validation errors
        return res.status(400).json({
          success: false,
          message: adminError.message
        });
      }
    }

    // Fallback to standard signUp using isolated authClient
    if (!user) {
      const { data, error } = await authClient.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name.trim()
          }
        }
      });

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      if (!data.user) {
        return res.status(400).json({
          success: false,
          message: 'User registration failed. Please try again.'
        });
      }

      user = data.user;
    }

    // Return created user details without exposing sensitive internals
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || name,
        created_at: user.created_at
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Log in an existing user
 * Route: POST /api/auth/login
 * Access: Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Call Supabase Auth signInWithPassword on isolated authClient
    const { data, error } = await authClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({
        success: false,
        message: error.message || 'Invalid email or password'
      });
    }

    if (!data.session) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. No active session returned.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        token_type: data.session.token_type || 'bearer',
        expires_in: data.session.expires_in,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || ''
        }
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
