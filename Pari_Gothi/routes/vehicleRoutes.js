const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
} = require('../controllers/vehicleController');

/**
 * @route   GET /api/vehicles
 * @desc    Fetch all vehicles (supports ?category=SUV&status=available)
 * @access  Public
 */
router.get('/', getAllVehicles);

/**
 * @route   GET /api/vehicles/:id
 * @desc    Fetch vehicle details including past rental history
 * @access  Public
 */
router.get('/:id', getVehicleById);

/**
 * @route   POST /api/vehicles
 * @desc    Add a new vehicle to fleet
 * @access  Private (Auth required)
 */
router.post('/', requireAuth, createVehicle);

/**
 * @route   PUT /api/vehicles/:id
 * @desc    Update vehicle details, daily_rate, or status
 * @access  Private (Auth required)
 */
router.put('/:id', requireAuth, updateVehicle);

/**
 * @route   DELETE /api/vehicles/:id
 * @desc    Delete vehicle from fleet (blocked if active/booked rentals exist)
 * @access  Private (Auth required)
 */
router.delete('/:id', requireAuth, deleteVehicle);

module.exports = router;
