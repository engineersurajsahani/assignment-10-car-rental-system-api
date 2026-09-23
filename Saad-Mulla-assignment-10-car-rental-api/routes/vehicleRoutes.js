const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {
  getVehicles,
  getVehicleById,
  addVehicle,
  updateVehicle,
  deleteVehicle
} = require('../controllers/vehicleController');

router.get('/', getVehicles);
router.get('/:id', getVehicleById);
router.post('/', authenticateToken, addVehicle);
router.put('/:id', authenticateToken, updateVehicle);
router.delete('/:id', authenticateToken, deleteVehicle);

module.exports = router;