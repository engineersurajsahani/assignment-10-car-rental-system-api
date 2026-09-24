const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} = require("../controllers/vehicleController");

// Public routes
router.get("/", getAllVehicles);
router.get("/:id", getVehicleById);

// Protected routes (Admin / Auth)
router.post("/", auth, createVehicle);
router.put("/:id", auth, updateVehicle);
router.delete("/:id", auth, deleteVehicle);

module.exports = router;
