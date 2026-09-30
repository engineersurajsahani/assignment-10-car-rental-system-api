const express = require('express');

const {
  createRental,
  getMyBookings,
  cancelRental,
  completeRental
} = require('../controllers/rentalController');

const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, createRental);

router.get('/my-bookings', authMiddleware, getMyBookings);

router.patch('/:id/cancel', authMiddleware, cancelRental);

router.patch('/:id/complete', authMiddleware, completeRental);

module.exports = router;