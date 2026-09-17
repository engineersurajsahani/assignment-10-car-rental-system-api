const express = require('express');
const authenticate = require('../middleware/auth');
const {
  createRental,
  getMyBookings,
  cancelRental,
  completeRental
} = require('../controllers/rentalController');

const router = express.Router();

router.use(authenticate);
router.post('/', createRental);
router.get('/my-bookings', getMyBookings);
router.patch('/:id/cancel', cancelRental);
router.patch('/:id/complete', completeRental);

module.exports = router;