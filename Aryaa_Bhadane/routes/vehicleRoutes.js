const express = require('express');
const router = express.Router();
const {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} = require('../controllers/vehicleController');
const authenticateUser = require('../middleware/auth');

// GET /api/vehicles - Fetch all vehicles (supports ?category=SUV&status=available)
router.get('/', getAllVehicles);

// GET /api/vehicles/:id - Get vehicle details with past rental records
router.get('/:id', getVehicleById);

// POST /api/vehicles - Add new vehicle to fleet (Protected)
router.post('/', authenticateUser, createVehicle);

// PUT /api/vehicles/:id - Update vehicle daily rate or status (Protected)
router.put('/:id', authenticateUser, updateVehicle);

// DELETE /api/vehicles/:id - Delete vehicle from fleet (Protected)
router.delete('/:id', authenticateUser, deleteVehicle);

module.exports = router;
