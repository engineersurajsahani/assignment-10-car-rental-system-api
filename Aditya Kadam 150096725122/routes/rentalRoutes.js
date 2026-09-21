const express = require('express');
const router = express.Router();
const {
    createRental,
    getMyBookings,
    cancelBooking,
    completeRental
} = require('../controllers/rentalController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, createRental);
router.get('/my-bookings', authenticate, getMyBookings);
router.patch('/:id/cancel', authenticate, cancelBooking);
router.patch('/:id/complete', authenticate, completeRental);

module.exports = router;
