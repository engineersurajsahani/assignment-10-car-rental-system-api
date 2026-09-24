const supabase = require("../config/supabase");

// Book a new vehicle rental
const bookRental = async (req, res, next) => {
  try {
    const { vehicle_id, start_date, end_date, customer_name, customer_email } = req.body;

    // Validate required fields
    if (!vehicle_id || !start_date || !end_date || !customer_name || !customer_email) {
      return res.status(400).json({
        message: "Please provide vehicle_id, start_date, end_date, customer_name, and customer_email.",
      });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format. Please use YYYY-MM-DD." });
    }

    if (end < start) {
      return res.status(400).json({ message: "End date must be greater than or equal to start date." });
    }

    // Check if vehicle exists
    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .select("*")
      .eq("id", vehicle_id)
      .single();

    if (vehicleError || !vehicle) {
      return res.status(404).json({ message: "Vehicle not found." });
    }

    // Check if vehicle is in maintenance
    if (vehicle.status === "maintenance") {
      return res.status(400).json({
        message: "Vehicle is currently under maintenance and not available for booking.",
      });
    }

    // Check for date collision with active/booked rentals
    const { data: conflictingRentals, error: conflictError } = await supabase
      .from("rentals")
      .select("id, start_date, end_date, status")
      .eq("vehicle_id", vehicle_id)
      .in("status", ["booked", "active"])
      .lte("start_date", end_date)
      .gte("end_date", start_date);

    if (conflictError) {
      return res.status(400).json({ message: conflictError.message });
    }

    if (conflictingRentals && conflictingRentals.length > 0) {
      return res.status(400).json({
        message: "Vehicle already reserved during this timeframe.",
      });
    }

    // Calculate number of rental days and total cost
    const diffTime = Math.abs(end - start);
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive of start & end day
    const totalCost = diffDays * parseFloat(vehicle.daily_rate);

    const newRental = {
      user_id: req.user.id,
      vehicle_id: parseInt(vehicle_id),
      customer_name,
      customer_email,
      start_date,
      end_date,
      total_cost: totalCost,
      status: "booked",
    };

    const { data: rental, error: insertError } = await supabase
      .from("rentals")
      .insert([newRental])
      .select()
      .single();

    if (insertError) {
      return res.status(400).json({ message: insertError.message });
    }

    res.status(201).json({
      message: "Vehicle booked successfully",
      days: diffDays,
      data: rental,
    });
  } catch (error) {
    next(error);
  }
};

// Get rentals for logged in user
const getMyBookings = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("rentals")
      .select("*, vehicles(*)")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(200).json({
      success: true,
      count: data.length,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

// Cancel an upcoming rental
const cancelRental = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: rental, error: fetchError } = await supabase
      .from("rentals")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !rental) {
      return res.status(404).json({ message: "Rental not found." });
    }

    if (rental.status === "cancelled") {
      return res.status(400).json({ message: "Rental is already cancelled." });
    }

    if (rental.status === "completed") {
      return res.status(400).json({ message: "Cannot cancel a completed rental." });
    }

    const { data, error } = await supabase
      .from("rentals")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(200).json({
      message: "Rental cancelled successfully",
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

// Mark rental as completed and vehicle back to available
const completeRental = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: rental, error: fetchError } = await supabase
      .from("rentals")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !rental) {
      return res.status(404).json({ message: "Rental not found." });
    }

    if (rental.status === "completed") {
      return res.status(400).json({ message: "Rental is already marked as completed." });
    }

    if (rental.status === "cancelled") {
      return res.status(400).json({ message: "Cannot complete a cancelled rental." });
    }

    const { data, error } = await supabase
      .from("rentals")
      .update({ status: "completed" })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    // Set vehicle status back to available
    await supabase
      .from("vehicles")
      .update({ status: "available" })
      .eq("id", rental.vehicle_id);

    res.status(200).json({
      message: "Rental completed and vehicle marked as available.",
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  bookRental,
  getMyBookings,
  cancelRental,
  completeRental,
};
