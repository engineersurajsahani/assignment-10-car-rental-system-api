const express = require('express');
const router = express.Router();
const {
  createRental,
  getMyBookings,
  cancelRental,
  completeRental,
} = require('../controllers/rentalController');
const authenticateUser = require('../middleware/auth');

// All rental routes require authentication
router.use(authenticateUser);

// POST /api/rentals - Book a vehicle (date overlap checks + cost computation)
router.post('/', createRental);

// GET /api/rentals/my-bookings - List rentals for authenticated user
router.get('/my-bookings', getMyBookings);

// PATCH /api/rentals/:id/cancel - Cancel upcoming rental
router.patch('/:id/cancel', cancelRental);

// PATCH /api/rentals/:id/complete - Mark car as returned (Sets vehicle status back to available)
router.patch('/:id/complete', completeRental);

module.exports = router;
