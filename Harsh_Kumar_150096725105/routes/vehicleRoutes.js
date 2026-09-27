const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const auth = require('../middleware/auth');

router.get('/', vehicleController.getVehicles);
router.get('/:id', vehicleController.getVehicleById);

// Protected routes (Admin in a real app, here just authenticated)
router.post('/', auth, vehicleController.addVehicle);
router.put('/:id', auth, vehicleController.updateVehicle);
router.delete('/:id', auth, vehicleController.deleteVehicle);

module.exports = router;
