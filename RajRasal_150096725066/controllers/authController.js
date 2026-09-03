const jwt = require('jsonwebtoken');
const { supabase, isMock } = require('../config/supabase');

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }

    if (!isMock && supabase.auth) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      if (error) {
        return res.status(400).json({ success: false, message: error.message });
      }

      return res.status(201).json({
        success: true,
        message: 'Customer registered successfully with Supabase',
        data: {
          user: data.user,
          session: data.session
        }
      });
    } else {
      // Mock Auth Registration
      const newUser = {
        id: `usr_${Date.now()}`,
        email,
        name,
        created_at: new Date().toISOString()
      };
      supabase.mockData.users.push(newUser);

      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, name: newUser.name },
        process.env.JWT_SECRET || 'supabase_demo_secret_token_2026',
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        success: true,
        message: 'Customer registered successfully',
        data: {
          user: newUser,
          token
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    if (!isMock && supabase.auth) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return res.status(401).json({ success: false, message: error.message });
      }

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: data.user,
          access_token: data.session.access_token
        }
      });
    } else {
      // Mock Auth Login
      const user = supabase.mockData.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || {
        id: 'usr_david_01',
        email,
        name: 'David'
      };

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        process.env.JWT_SECRET || 'supabase_demo_secret_token_2026',
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user,
          token
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
