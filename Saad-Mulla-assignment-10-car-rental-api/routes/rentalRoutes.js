const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {
  createRental,
  getMyBookings,
  cancelRental,
  completeRental
} = require('../controllers/rentalController');

router.post('/', authenticateToken, createRental);
router.get('/my-bookings', authenticateToken, getMyBookings);
router.patch('/:id/cancel', authenticateToken, cancelRental);
router.patch('/:id/complete', authenticateToken, completeRental);

module.exports = router;