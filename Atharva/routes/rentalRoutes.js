const express = require('express');
const { bookVehicle, getMyBookings, cancelBooking, completeBooking } = require('../controllers/rentalController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.post('/', bookVehicle);
router.get('/my-bookings', getMyBookings);
router.patch('/:id/cancel', cancelBooking);
router.patch('/:id/complete', completeBooking);

module.exports = router;
