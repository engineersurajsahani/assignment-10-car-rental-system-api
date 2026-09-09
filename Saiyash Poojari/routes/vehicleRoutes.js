const express = require('express');
const router = express.Router();
const {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
} = require('../controllers/vehicleController');
const authenticateUser = require('../middleware/auth');

router.get('/', getVehicles);
router.get('/:id', getVehicleById);

router.post('/', authenticateUser, createVehicle);
router.put('/:id', authenticateUser, updateVehicle);
router.delete('/:id', authenticateUser, deleteVehicle);

module.exports = router;
