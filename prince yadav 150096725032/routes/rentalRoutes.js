const express = require('express');
const router = express.Router();
const {
  createRental,
  getMyBookings,
  cancelRental,
  completeRental
} = require('../controllers/rentalController');
const { requireAuth } = require('../middleware/auth');

// All rental operations require Supabase authentication
router.use(requireAuth);

// Booking endpoints
router.post('/', createRental);
router.get('/my-bookings', getMyBookings);
router.patch('/:id/cancel', cancelRental);
router.patch('/:id/complete', completeRental);

module.exports = router;
