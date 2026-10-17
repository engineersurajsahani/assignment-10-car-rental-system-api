const supabase = require('../config/supabase');

exports.register = async (req, res, next) => {
    try {
        const { email, password, name } = req.body;
        
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name }
            }
        });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({ message: 'User registered successfully', data });
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return res.status(401).json({ error: error.message });
        }

        res.status(200).json({ message: 'Login successful', data });
    } catch (error) {
        next(error);
    }
};
