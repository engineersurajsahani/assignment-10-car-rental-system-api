const express = require('express');

const {
    getVehicles,
    getVehicleById,
    createVehicle,
    updateVehicle,
    deleteVehicle
} = require('../controllers/vehicleController');

const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getVehicles);
router.get('/:id', getVehicleById);

// Protected routes
router.post('/', authMiddleware, createVehicle);
router.put('/:id', authMiddleware, updateVehicle);
router.delete('/:id', authMiddleware, deleteVehicle);

module.exports = router;