const express = require('express');
const auth = require('../middleware/auth');
const { createRental, getMyBookings, cancelRental, completeRental } = require('../controllers/rentalController');
const router = express.Router();
router.post('/', auth, createRental);
router.get('/my-bookings', auth, getMyBookings);
router.patch('/:id/cancel', auth, cancelRental);
router.patch('/:id/complete', auth, completeRental);
module.exports = router;
