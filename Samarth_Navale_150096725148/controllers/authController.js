const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { memoryUsers } = require('../config/store');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    const exist = memoryUsers.find((u) => u.email === email.toLowerCase());
    if (exist) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const usr = {
      id: uuidv4(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hash,
      created_at: new Date().toISOString()
    };

    memoryUsers.push(usr);

    const token = jwt.sign(
      { id: usr.id, email: usr.email, name: usr.name },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '7d' }
    );

    const { password: _, ...safe } = usr;
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user: safe, token }
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const usr = memoryUsers.find((u) => u.email === email.toLowerCase());
    if (!usr) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, usr.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: usr.id, email: usr.email, name: usr.name },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '7d' }
    );

    const { password: _, ...safe } = usr;
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user: safe, token }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
