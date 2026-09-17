const express = require('express');
const authenticate = require('../middleware/auth');
const {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle
} = require('../controllers/vehicleController');

const router = express.Router();

router.get('/', getVehicles);
router.get('/:id', getVehicle);
router.post('/', authenticate, createVehicle);
router.put('/:id', authenticate, updateVehicle);
router.delete('/:id', authenticate, deleteVehicle);

module.exports = router;