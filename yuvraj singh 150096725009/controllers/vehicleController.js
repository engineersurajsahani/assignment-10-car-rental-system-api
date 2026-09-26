const supabase = require('../config/supabase');

const VALID_CATEGORIES = ['Sedan', 'SUV', 'Luxury', 'Hatchback', 'Electric'];
const VALID_STATUSES = ['available', 'rented', 'maintenance'];

/**
 * Get all vehicles with optional filters
 * Route: GET /api/vehicles
 * Query params: ?category=SUV&status=available
 * Access: Public
 */
const getVehicles = async (req, res, next) => {
  try {
    const { category, status } = req.query;

    let query = supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return next(error);
    }

    return res.status(200).json({
      success: true,
      count: data ? data.length : 0,
      data: data || []
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get a single vehicle by ID along with its rental history
 * Route: GET /api/vehicles/:id
 * Access: Public
 */
const getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch vehicle
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();

    if (vehicleError || !vehicle) {
      return res.status(404).json({
        success: false,
        message: `Vehicle with ID ${id} not found`
      });
    }

    // Fetch past and current rentals for this vehicle ordered by start_date DESC
    const { data: rentals, error: rentalsError } = await supabase
      .from('rentals')
      .select('id, user_id, customer_name, customer_email, start_date, end_date, total_cost, status, created_at')
      .eq('vehicle_id', id)
      .order('start_date', { ascending: false });

    if (rentalsError) {
      return next(rentalsError);
    }

    return res.status(200).json({
      success: true,
      data: {
        ...vehicle,
        rentals: rentals || []
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new vehicle
 * Route: POST /api/vehicles
 * Access: Private (Auth required)
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
      status = 'available'
    } = req.body;

    // Validation
    if (!brand || !model || !year || !category || daily_rate === undefined || !fuel_type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: brand, model, year, category, daily_rate, and fuel_type are required'
      });
    }

    const numericRate = parseFloat(daily_rate);
    if (isNaN(numericRate) || numericRate <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: daily_rate must be a positive number greater than 0'
      });
    }

    const numericYear = parseInt(year, 10);
    if (isNaN(numericYear) || numericYear < 1900 || numericYear > new Date().getFullYear() + 2) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Please provide a valid vehicle year'
      });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Validation Error: Invalid category '${category}'. Must be one of: ${VALID_CATEGORIES.join(', ')}`
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Validation Error: Invalid status '${status}'. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    const numericCapacity = parseInt(seating_capacity, 10);
    if (isNaN(numericCapacity) || numericCapacity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: seating_capacity must be a positive integer'
      });
    }

    const { data, error } = await supabase
      .from('vehicles')
      .insert([
        {
          brand: brand.trim(),
          model: model.trim(),
          year: numericYear,
          category,
          daily_rate: numericRate,
          fuel_type: fuel_type.trim(),
          seating_capacity: numericCapacity,
          status
        }
      ])
      .select()
      .single();

    if (error) {
      return next(error);
    }

    return res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update an existing vehicle (e.g. daily_rate and/or status)
 * Route: PUT /api/vehicles/:id
 * Access: Private (Auth required)
 */
const updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { brand, model, year, category, daily_rate, fuel_type, seating_capacity, status } = req.body;

    // Check if vehicle exists
    const { data: existing, error: findError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({
        success: false,
        message: `Vehicle with ID ${id} not found`
      });
    }

    const updates = {};

    if (brand !== undefined) updates.brand = brand.trim();
    if (model !== undefined) updates.model = model.trim();

    if (year !== undefined) {
      const numericYear = parseInt(year, 10);
      if (isNaN(numericYear) || numericYear < 1900) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error: year must be a valid 4-digit year'
        });
      }
      updates.year = numericYear;
    }

    if (category !== undefined) {
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Validation Error: Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`
        });
      }
      updates.category = category;
    }

    if (daily_rate !== undefined) {
      const numericRate = parseFloat(daily_rate);
      if (isNaN(numericRate) || numericRate <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error: daily_rate must be a positive number greater than 0'
        });
      }
      updates.daily_rate = numericRate;
    }

    if (fuel_type !== undefined) updates.fuel_type = fuel_type.trim();

    if (seating_capacity !== undefined) {
      const cap = parseInt(seating_capacity, 10);
      if (isNaN(cap) || cap <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error: seating_capacity must be a positive integer'
        });
      }
      updates.seating_capacity = cap;
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Validation Error: Invalid status '${status}'. Must be one of: ${VALID_STATUSES.join(', ')}`
        });
      }
      updates.status = status;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one field to update'
      });
    }

    const { data, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return next(error);
    }

    return res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a vehicle
 * Route: DELETE /api/vehicles/:id
 * Access: Private (Auth required)
 */
const deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if vehicle exists
    const { data: vehicle, error: findError } = await supabase
      .from('vehicles')
      .select('id, brand, model')
      .eq('id', id)
      .single();

    if (findError || !vehicle) {
      return res.status(404).json({
        success: false,
        message: `Vehicle with ID ${id} not found`
      });
    }

    // Check for active or booked rentals
    const { data: activeRentals, error: rentalCheckError } = await supabase
      .from('rentals')
      .select('id, status, start_date, end_date')
      .eq('vehicle_id', id)
      .in('status', ['booked', 'active']);

    if (rentalCheckError) {
      return next(rentalCheckError);
    }

    if (activeRentals && activeRentals.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle has active bookings and cannot be deleted'
      });
    }

    // Attempt delete
    const { error: deleteError } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (deleteError) {
      // Check for foreign key restriction (e.g. historical completed/cancelled rentals)
      if (deleteError.code === '23503') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete vehicle because historical rental records are linked to it (ON DELETE RESTRICT). You may set its status to "maintenance" instead.'
        });
      }
      return next(deleteError);
    }

    return res.status(200).json({
      success: true,
      message: `Vehicle '${vehicle.brand} ${vehicle.model}' (ID: ${id}) deleted successfully`
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
};
