const supabase = require('../config/supabase');

exports.register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    });

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(201).json({ success: true, message: 'User registered successfully', data });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ success: false, message: error.message });
    }

    res.status(200).json({ success: true, message: 'Logged in successfully', session: data.session });
  } catch (error) {
    next(error);
  }
};
