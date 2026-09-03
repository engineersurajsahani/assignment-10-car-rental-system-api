const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rentalController');
const authenticateSupabase = require('../middleware/auth');

router.use(authenticateSupabase);

router.post('/', rentalController.createRental);
router.get('/my-bookings', rentalController.getMyBookings);
router.patch('/:id/cancel', rentalController.cancelRental);
router.patch('/:id/complete', rentalController.completeRental);

module.exports = router;
