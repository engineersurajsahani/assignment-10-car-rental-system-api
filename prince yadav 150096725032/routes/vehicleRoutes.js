const express = require('express');
const router = express.Router();
const {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
} = require('../controllers/vehicleController');
const { requireAuth } = require('../middleware/auth');

// Public Fleet Browsing Routes
router.get('/', getVehicles);
router.get('/:id', getVehicleById);

// Protected Fleet Management Routes
router.post('/', requireAuth, createVehicle);
router.put('/:id', requireAuth, updateVehicle);
router.delete('/:id', requireAuth, deleteVehicle);

module.exports = router;
