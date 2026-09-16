const express = require('express');
const router = express.Router();
const {
  createRental,
  getMyBookings,
  cancelRental,
  completeRental
} = require('../controllers/rentalController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createRental);
router.get('/my-bookings', protect, getMyBookings);
router.patch('/:id/cancel', protect, cancelRental);
router.patch('/:id/complete', protect, completeRental);

module.exports = router;