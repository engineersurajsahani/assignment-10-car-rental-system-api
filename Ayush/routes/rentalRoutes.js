const express = require('express');
const router = express.Router();
const {
  createRental,
  getMyBookings,
  cancelRental,
  completeRental,
} = require('../controllers/rentalController');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

router.use(requireAuth);

router.post('/', asyncHandler(createRental));

router.get('/my-bookings', asyncHandler(getMyBookings));

router.patch('/:id/cancel', asyncHandler(cancelRental));

router.patch('/:id/complete', asyncHandler(completeRental));

module.exports = router;
