const { supabase } = require('../config/supabase');

const VALID_CATEGORIES = ['Sedan', 'SUV', 'Luxury', 'Hatchback', 'Electric'];
const VALID_STATUSES = ['available', 'rented', 'maintenance'];

/**
 * @desc    Fetch all vehicles (with optional filters ?category=SUV&status=available)
 * @route   GET /api/vehicles
 * @access  Public
 */
const getAllVehicles = async (req, res, next) => {
  try {
    const { category, status, brand } = req.query;

    let query = supabase
      .from('vehicles')
      .select('*')
      .order('id', { ascending: true });

    // Apply category filter if provided
    if (category) {
      query = query.eq('category', category);
    }

    // Apply status filter if provided (e.g. available, rented, maintenance)
    if (status) {
      query = query.eq('status', status);
    }

    // Apply brand filter if provided
    if (brand) {
      query = query.ilike('brand', `%${brand}%`);
    }

    const { data: vehicles, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      count: vehicles ? vehicles.length : 0,
      data: vehicles || [],
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get vehicle details along with related past rental records
 * @route   GET /api/vehicles/:id
 * @access  Public
 */
const getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch vehicle along with related rentals through foreign key relation
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        rentals (
          id,
          user_id,
          customer_name,
          customer_email,
          start_date,
          end_date,
          total_cost,
          status,
          created_at
        )
      `)
      .eq('id', id)
      .single();

    if (error || !vehicle) {
      return res.status(404).json({
        success: false,
        error: `Vehicle with id ${id} not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: vehicle,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Add new vehicle to fleet (Admin / Authenticated)
 * @route   POST /api/vehicles
 * @access  Private
 */
const createVehicle = async (req, res, next) => {
  try {
    const {
      brand,
      model,
      year,
      category,
      daily_rate,
      fuel_type,
      seating_capacity = 5,
      status = 'available',
    } = req.body;

    // Validate required fields
    if (!brand || !model || !year || !category || daily_rate === undefined || !fuel_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required vehicle fields: brand, model, year, category, daily_rate, fuel_type.',
      });
    }

    // Validate category enum
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Invalid category '${category}'. Allowed categories: ${VALID_CATEGORIES.join(', ')}.`,
      });
    }

    // Validate daily rate
    const parsedRate = parseFloat(daily_rate);
    if (isNaN(parsedRate) || parsedRate <= 0) {
      return res.status(400).json({
        success: false,
        error: 'daily_rate must be a positive numeric value greater than 0.',
      });
    }

    // Validate status
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status '${status}'. Allowed statuses: ${VALID_STATUSES.join(', ')}.`,
      });
    }

    // Insert vehicle into Supabase
    const { data: newVehicle, error } = await supabase
      .from('vehicles')
      .insert([
        {
          brand,
          model,
          year: parseInt(year, 10),
          category,
          daily_rate: parsedRate,
          fuel_type,
          seating_capacity: parseInt(seating_capacity, 10) || 5,
          status,
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Vehicle added to fleet successfully.',
      data: newVehicle,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update vehicle daily rate, status, or details
 * @route   PUT /api/vehicles/:id
 * @access  Private
 */
const updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { brand, model, year, category, daily_rate, fuel_type, seating_capacity, status } = req.body;

    // Check if vehicle exists
    const { data: existingVehicle, error: fetchError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingVehicle) {
      return res.status(404).json({
        success: false,
        error: `Vehicle with id ${id} not found.`,
      });
    }

    const updates = {};

    if (brand !== undefined) updates.brand = brand;
    if (model !== undefined) updates.model = model;
    if (year !== undefined) updates.year = parseInt(year, 10);
    if (fuel_type !== undefined) updates.fuel_type = fuel_type;
    if (seating_capacity !== undefined) updates.seating_capacity = parseInt(seating_capacity, 10);

    if (category !== undefined) {
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          error: `Invalid category '${category}'. Allowed categories: ${VALID_CATEGORIES.join(', ')}.`,
        });
      }
      updates.category = category;
    }

    if (daily_rate !== undefined) {
      const parsedRate = parseFloat(daily_rate);
      if (isNaN(parsedRate) || parsedRate <= 0) {
        return res.status(400).json({
          success: false,
          error: 'daily_rate must be a positive number greater than 0.',
        });
      }
      updates.daily_rate = parsedRate;
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status '${status}'. Allowed statuses: ${VALID_STATUSES.join(', ')}.`,
        });
      }
      updates.status = status;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least one field to update.',
      });
    }

    const { data: updatedVehicle, error: updateError } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({
        success: false,
        error: updateError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully.',
      data: updatedVehicle,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete vehicle from fleet (Rejects if active or booked rentals exist)
 * @route   DELETE /api/vehicles/:id
 * @access  Private
 */
const deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Check if vehicle exists
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, brand, model')
      .eq('id', id)
      .single();

    if (vehicleError || !vehicle) {
      return res.status(404).json({
        success: false,
        error: `Vehicle with id ${id} not found.`,
      });
    }

    // 2. Check for active or booked rentals referencing this vehicle
    const { data: activeRentals, error: rentalCheckError } = await supabase
      .from('rentals')
      .select('id, status, start_date, end_date')
      .eq('vehicle_id', id)
      .in('status', ['booked', 'active']);

    if (rentalCheckError) {
      return res.status(500).json({
        success: false,
        error: rentalCheckError.message,
      });
    }

    if (activeRentals && activeRentals.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete vehicle with active or booked rentals. Found ${activeRentals.length} active reservation(s).`,
        active_rentals: activeRentals,
      });
    }

    // 3. Delete the vehicle
    const { error: deleteError } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(400).json({
        success: false,
        error: deleteError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Vehicle ${vehicle.brand} ${vehicle.model} (ID: ${id}) deleted successfully.`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};
