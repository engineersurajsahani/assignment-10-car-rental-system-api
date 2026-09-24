const supabase = require("../config/supabase");

// Get all vehicles with optional filters
const getAllVehicles = async (req, res, next) => {
  try {
    const { category, status } = req.query;

    let query = supabase.from("vehicles").select("*");

    if (category) {
      query = query.eq("category", category);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("id", { ascending: true });

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

// Get single vehicle with rental history
const getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("vehicles")
      .select("*, rentals(*)")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: "Vehicle not found." });
    }

    res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

// Add new vehicle to fleet
const createVehicle = async (req, res, next) => {
  try {
    const {
      brand,
      model,
      year,
      category,
      daily_rate,
      fuel_type,
      seating_capacity,
      status,
    } = req.body;

    if (!brand || !model || !year || !category || !daily_rate || !fuel_type) {
      return res.status(400).json({
        message: "Please provide brand, model, year, category, daily_rate, and fuel_type.",
      });
    }

    const allowedCategories = ["Sedan", "SUV", "Luxury", "Hatchback", "Electric"];
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        message: `Invalid category. Must be one of: ${allowedCategories.join(", ")}`,
      });
    }

    const newVehicle = {
      brand,
      model,
      year: parseInt(year),
      category,
      daily_rate: parseFloat(daily_rate),
      fuel_type,
      seating_capacity: seating_capacity ? parseInt(seating_capacity) : 5,
      status: status || "available",
    };

    const { data, error } = await supabase
      .from("vehicles")
      .insert([newVehicle])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(201).json({
      message: "Vehicle added successfully",
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

// Update vehicle details
const updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if vehicle exists
    const { data: existing, error: checkError } = await supabase
      .from("vehicles")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({ message: "Vehicle not found." });
    }

    const { data, error } = await supabase
      .from("vehicles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(200).json({
      message: "Vehicle updated successfully",
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

// Delete vehicle from fleet
const deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if vehicle exists
    const { data: vehicle, error: fetchError } = await supabase
      .from("vehicles")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !vehicle) {
      return res.status(404).json({ message: "Vehicle not found." });
    }

    // Check for active or booked rentals
    const { data: activeRentals, error: rentalError } = await supabase
      .from("rentals")
      .select("id")
      .eq("vehicle_id", id)
      .in("status", ["booked", "active"]);

    if (rentalError) {
      return res.status(400).json({ message: rentalError.message });
    }

    if (activeRentals && activeRentals.length > 0) {
      return res.status(400).json({
        message: "Cannot delete vehicle with active or booked rentals.",
      });
    }

    const { error: deleteError } = await supabase
      .from("vehicles")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return res.status(400).json({ message: deleteError.message });
    }

    res.status(200).json({
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};
