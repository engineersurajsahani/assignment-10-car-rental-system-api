const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const requireAuth = require('../middleware/auth');

// Public routes
// GET /api/vehicles - List all vehicles with optional filters (?category=SUV&status=available)
router.get('/', vehicleController.getVehicles);

// GET /api/vehicles/:id - Get vehicle details with past rental history
router.get('/:id', vehicleController.getVehicleById);

// Protected routes (Authentication required)
// POST /api/vehicles - Add a new vehicle to the fleet
router.post('/', requireAuth, vehicleController.createVehicle);

// PUT /api/vehicles/:id - Update vehicle information (daily_rate, status, etc.)
router.put('/:id', requireAuth, vehicleController.updateVehicle);

// DELETE /api/vehicles/:id - Delete a vehicle (blocked if active bookings exist)
router.delete('/:id', requireAuth, vehicleController.deleteVehicle);

module.exports = router;
