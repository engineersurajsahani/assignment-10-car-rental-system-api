const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const {
  createRental,
  getMyBookings,
  cancelRental,
  completeRental
} = require('../controllers/rentalController');

// All rental endpoints are protected by Supabase Auth
router.use(requireAuth);

/**
 * @route   POST /api/rentals
 * @desc    Book a vehicle (validates date collision & computes server-side total_cost)
 * @access  Private
 */
router.post('/', createRental);

/**
 * @route   GET /api/rentals/my-bookings
 * @desc    Get all bookings for authenticated user
 * @access  Private
 */
router.get('/my-bookings', getMyBookings);

/**
 * @route   PATCH /api/rentals/:id/cancel
 * @desc    Cancel an upcoming rental
 * @access  Private
 */
router.patch('/:id/cancel', cancelRental);

/**
 * @route   PATCH /api/rentals/:id/complete
 * @desc    Complete a rental and restore vehicle status to available
 * @access  Private
 */
router.patch('/:id/complete', completeRental);

module.exports = router;
