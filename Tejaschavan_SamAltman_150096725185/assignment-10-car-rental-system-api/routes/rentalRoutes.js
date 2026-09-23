const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rentalController');
const requireAuth = require('../middleware/auth');

// All rental routes require authentication
router.use(requireAuth);

// GET /api/rentals/my-bookings - List bookings for current authenticated user
router.get('/my-bookings', rentalController.getMyBookings);

// POST /api/rentals - Book a vehicle (with date collision check & server-side pricing)
router.post('/', rentalController.createRental);

// PATCH /api/rentals/:id/cancel - Cancel a rental booking
router.patch('/:id/cancel', rentalController.cancelRental);

// PATCH /api/rentals/:id/complete - Complete a rental booking
router.patch('/:id/complete', rentalController.completeRental);

module.exports = router;
