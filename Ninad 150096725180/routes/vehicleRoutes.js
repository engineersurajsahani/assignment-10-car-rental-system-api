const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const authenticate = require('../middleware/auth');

router.get('/', vehicleController.getVehicles);
router.get('/:id', vehicleController.getVehicleById);
router.post('/', authenticate, vehicleController.createVehicle);
router.put('/:id', authenticate, vehicleController.updateVehicle);
router.delete('/:id', authenticate, vehicleController.deleteVehicle);

module.exports = router;
