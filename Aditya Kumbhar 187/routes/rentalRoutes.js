const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  bookRental,
  getMyBookings,
  cancelRental,
  completeRental,
} = require("../controllers/rentalController");

// All rental operations require authentication
router.post("/", auth, bookRental);
router.get("/my-bookings", auth, getMyBookings);
router.patch("/:id/cancel", auth, cancelRental);
router.patch("/:id/complete", auth, completeRental);

module.exports = router;
