const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new customer with Supabase Auth
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate customer and return Supabase JWT token
 * @access  Public
 */
router.post('/login', login);

module.exports = router;
