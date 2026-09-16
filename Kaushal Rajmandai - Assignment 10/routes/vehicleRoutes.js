const express = require('express');
const router = express.Router();
const {
  getVehicles,
  getVehicleById,
  addVehicle,
  updateVehicle,
  deleteVehicle
} = require('../controllers/vehicleController');
const { protect } = require('../middleware/auth');

router.get('/', getVehicles);
router.get('/:id', getVehicleById);
router.post('/', protect, addVehicle);
router.put('/:id', protect, updateVehicle);
router.delete('/:id', protect, deleteVehicle);

module.exports = router;