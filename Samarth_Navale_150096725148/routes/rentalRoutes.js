const express = require('express');
const router = express.Router();
const {
  bookRental,
  getMyBookings,
  cancelRental,
  completeRental
} = require('../controllers/rentalController');
const auth = require('../middleware/auth');

router.post('/', auth, bookRental);
router.get('/my-bookings', auth, getMyBookings);
router.patch('/:id/cancel', auth, cancelRental);
router.patch('/:id/complete', auth, completeRental);

module.exports = router;
