const { supabase, supabaseAdmin } = require('../config/supabase');

const VALID_CATEGORIES = ['Sedan', 'SUV', 'Luxury', 'Hatchback', 'Electric'];
const VALID_STATUSES = ['available', 'rented', 'maintenance'];

/**
 * @desc    Fetch all vehicles with optional filters (?category=SUV&status=available)
 * @route   GET /api/vehicles
 * @access  Public
 */
const getVehicles = async (req, res, next) => {
  try {
    const { category, status } = req.query;

    let query = supabase.from('vehicles').select('*');

    if (category) {
      query = query.eq('category', category);
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('id', { ascending: true });

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get vehicle details with past rental records (relational join)
 * @route   GET /api/vehicles/:id
 * @access  Public
 */
const getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Relational join with rentals table
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, rentals(*)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: `Vehicle with ID ${id} not found.`
      });
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add new vehicle to fleet
 * @route   POST /api/vehicles
 * @access  Private (Auth Required)
 */
const createVehicle = async (req, res, next) => {
  try {
    const { brand, model, year, category, daily_rate, fuel_type, seating_capacity, status } = req.body;

    // Input Validation
    if (!brand || !model || !year || !category || daily_rate === undefined || !fuel_type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: brand, model, year, category, daily_rate, fuel_type.'
      });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category '${category}'. Allowed categories: ${VALID_CATEGORIES.join(', ')}`
      });
    }

    const numericRate = Number(daily_rate);
    if (isNaN(numericRate) || numericRate <= 0) {
      return res.status(400).json({
        success: false,
        message: 'daily_rate must be a positive number greater than 0.'
      });
    }

    const vehicleStatus = status || 'available';
    if (!VALID_STATUSES.includes(vehicleStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status '${vehicleStatus}'. Allowed statuses: ${VALID_STATUSES.join(', ')}`
      });
    }

    const newVehicle = {
      brand: brand.trim(),
      model: model.trim(),
      year: parseInt(year, 10),
      category,
      daily_rate: numericRate,
      fuel_type: fuel_type.trim(),
      seating_capacity: seating_capacity ? parseInt(seating_capacity, 10) : 5,
      status: vehicleStatus
    };

    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('vehicles')
      .insert(newVehicle)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Vehicle added to fleet successfully.',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update vehicle daily rate or status
 * @route   PUT /api/vehicles/:id
 * @access  Private (Auth Required)
 */
const updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { daily_rate, status } = req.body;

    const updates = {};

    if (daily_rate !== undefined) {
      const rate = Number(daily_rate);
      if (isNaN(rate) || rate <= 0) {
        return res.status(400).json({
          success: false,
          message: 'daily_rate must be a positive number greater than 0.'
        });
      }
      updates.daily_rate = rate;
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status '${status}'. Allowed statuses: ${VALID_STATUSES.join(', ')}`
        });
      }
      updates.status = status;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one valid field to update (daily_rate or status).'
      });
    }

    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('vehicles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: `Vehicle with ID ${id} not found.`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully.',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete vehicle from fleet (Protected against active bookings)
 * @route   DELETE /api/vehicles/:id
 * @access  Private (Auth Required)
 */
const deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if vehicle exists
    const { data: vehicle, error: fetchErr } = await supabase
      .from('vehicles')
      .select('id, brand, model')
      .eq('id', id)
      .single();

    if (fetchErr || !vehicle) {
      return res.status(404).json({
        success: false,
        message: `Vehicle with ID ${id} not found.`
      });
    }

    // Check if vehicle has active or booked reservations
    const { data: activeRentals, error: rentalErr } = await supabase
      .from('rentals')
      .select('id, status')
      .eq('vehicle_id', id)
      .in('status', ['booked', 'active']);

    if (activeRentals && activeRentals.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete vehicle #${id}: It has ${activeRentals.length} active or booked reservation(s).`
      });
    }

    const client = supabaseAdmin || supabase;
    const { error: deleteErr } = await client
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (deleteErr) {
      return res.status(400).json({
        success: false,
        message: deleteErr.message
      });
    }

    res.status(200).json({
      success: true,
      message: `Vehicle #${id} (${vehicle.brand} ${vehicle.model}) successfully removed from fleet.`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
};
