const express = require('express');
const router = express.Router();
const {
  createRental,
  getMyBookings,
  cancelRental,
  completeRental
} = require('../controllers/rentalController');
const authenticateUser = require('../middleware/auth');

router.use(authenticateUser);

router.post('/', createRental);
router.get('/my-bookings', getMyBookings);
router.patch('/:id/cancel', cancelRental);
router.patch('/:id/complete', completeRental);

module.exports = router;
