const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const authenticateSupabase = require('../middleware/auth');

// Public routes
router.get('/', vehicleController.getAllVehicles);
router.get('/:id', vehicleController.getVehicleById);

// Admin / Authenticated vehicle management
router.post('/', authenticateSupabase, vehicleController.createVehicle);
router.put('/:id', authenticateSupabase, vehicleController.updateVehicle);
router.delete('/:id', authenticateSupabase, vehicleController.deleteVehicle);

module.exports = router;
