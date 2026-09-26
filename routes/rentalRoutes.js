const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rentalController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', rentalController.bookRental);
router.get('/my-bookings', rentalController.getMyBookings);
router.patch('/:id/cancel', rentalController.cancelBooking);
router.patch('/:id/complete', rentalController.completeBooking);

module.exports = router;
