const supabase = require('../config/supabase');

const VALID_CATEGORIES = ['Sedan', 'SUV', 'Luxury', 'Hatchback', 'Electric'];
const VALID_STATUSES = ['available', 'rented', 'maintenance'];

/**
 * Get all vehicles in the fleet with optional filters
 * GET /api/vehicles?category=SUV&status=available
 */
const getAllVehicles = async (req, res, next) => {
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

    const { data: vehicles, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      count: vehicles.length,
      vehicles
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get single vehicle by ID including past rental records
 * GET /api/vehicles/:id
 */
const getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;

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
        error: `Vehicle with ID ${id} not found.`
      });
    }

    return res.status(200).json({ vehicle });
  } catch (err) {
    next(err);
  }
};

/**
 * Add a new vehicle to fleet
 * POST /api/vehicles (Auth Required)
 * Body: { brand, model, year, category, daily_rate, fuel_type, seating_capacity, status }
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
    if (!brand || !model || !year || !category || !daily_rate || !fuel_type) {
      return res.status(400).json({
        error: 'Missing required vehicle fields: brand, model, year, category, daily_rate, fuel_type are required.'
      });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: `Invalid category. Allowed categories are: ${VALID_CATEGORIES.join(', ')}`
      });
    }

    if (Number(daily_rate) <= 0) {
      return res.status(400).json({
        error: 'daily_rate must be a positive number greater than 0.'
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Allowed statuses are: ${VALID_STATUSES.join(', ')}`
      });
    }

    const { data: newVehicle, error } = await supabase
      .from('vehicles')
      .insert([
        {
          brand,
          model,
          year: parseInt(year, 10),
          category,
          daily_rate: parseFloat(daily_rate),
          fuel_type,
          seating_capacity: parseInt(seating_capacity, 10),
          status
        }
      ])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({
      message: 'Vehicle added successfully.',
      vehicle: newVehicle
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update vehicle daily rate, status, or details
 * PUT /api/vehicles/:id (Auth Required)
 */
const updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if vehicle exists
    const { data: existingVehicle, error: fetchError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingVehicle) {
      return res.status(404).json({
        error: `Vehicle with ID ${id} not found.`
      });
    }

    // Validate category if present
    if (updates.category && !VALID_CATEGORIES.includes(updates.category)) {
      return res.status(400).json({
        error: `Invalid category. Allowed categories are: ${VALID_CATEGORIES.join(', ')}`
      });
    }

    // Validate status if present
    if (updates.status && !VALID_STATUSES.includes(updates.status)) {
      return res.status(400).json({
        error: `Invalid status. Allowed statuses are: ${VALID_STATUSES.join(', ')}`
      });
    }

    // Validate daily_rate if present
    if (updates.daily_rate !== undefined && Number(updates.daily_rate) <= 0) {
      return res.status(400).json({
        error: 'daily_rate must be a positive number greater than 0.'
      });
    }

    const { data: updatedVehicle, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      message: 'Vehicle updated successfully.',
      vehicle: updatedVehicle
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a vehicle from fleet (blocked if active or booked rentals exist)
 * DELETE /api/vehicles/:id (Auth Required)
 */
const deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if vehicle exists
    const { data: vehicle, error: fetchError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !vehicle) {
      return res.status(404).json({
        error: `Vehicle with ID ${id} not found.`
      });
    }

    // Check for active or booked rentals
    const { data: activeRentals, error: rentalCheckError } = await supabase
      .from('rentals')
      .select('id, status')
      .eq('vehicle_id', id)
      .in('status', ['booked', 'active']);

    if (rentalCheckError) {
      return res.status(500).json({ error: rentalCheckError.message });
    }

    if (activeRentals && activeRentals.length > 0) {
      return res.status(400).json({
        error: `Cannot delete vehicle: It has ${activeRentals.length} active or booked reservation(s).`
      });
    }

    // Perform deletion
    const { error: deleteError } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(400).json({ error: deleteError.message });
    }

    return res.status(200).json({
      message: `Vehicle with ID ${id} deleted successfully.`
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
  deleteVehicle
};
