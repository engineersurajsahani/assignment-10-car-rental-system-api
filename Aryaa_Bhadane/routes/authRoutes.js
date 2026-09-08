const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// POST /api/auth/register - Register customer with Supabase Auth
router.post('/register', register);

// POST /api/auth/login - Login and receive Supabase access token (JWT)
router.post('/login', login);

module.exports = router;
