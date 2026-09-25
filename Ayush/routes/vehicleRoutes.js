const express = require('express');
const router = express.Router();
const {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} = require('../controllers/vehicleController');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

router.get('/', asyncHandler(getVehicles));

router.get('/:id', asyncHandler(getVehicleById));

router.post('/', requireAuth, asyncHandler(createVehicle));

router.put('/:id', requireAuth, asyncHandler(updateVehicle));

router.delete('/:id', requireAuth, asyncHandler(deleteVehicle));

module.exports = router;
