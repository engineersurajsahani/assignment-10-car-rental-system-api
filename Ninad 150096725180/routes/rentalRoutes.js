const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rentalController');
const authenticate = require('../middleware/auth');

router.post('/', authenticate, rentalController.bookVehicle);
router.get('/my-bookings', authenticate, rentalController.myBookings);
router.patch('/:id/cancel', authenticate, rentalController.cancelRental);
router.patch('/:id/complete', authenticate, rentalController.completeRental);

module.exports = router;
