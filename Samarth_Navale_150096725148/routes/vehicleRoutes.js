const express = require('express');
const router = express.Router();
const {
  getVehicles,
  getVehicleById,
  addVehicle,
  updateVehicle,
  deleteVehicle
} = require('../controllers/vehicleController');
const auth = require('../middleware/auth');

router.get('/', getVehicles);
router.get('/:id', getVehicleById);
router.post('/', auth, addVehicle);
router.put('/:id', auth, updateVehicle);
router.delete('/:id', auth, deleteVehicle);

module.exports = router;
