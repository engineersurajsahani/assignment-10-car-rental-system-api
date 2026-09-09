const supabase = require('../config/supabase');

const VALID_CATEGORIES = ['Sedan', 'SUV', 'Luxury', 'Hatchback', 'Electric'];
const VALID_STATUSES = ['available', 'rented', 'maintenance'];

const getVehicles = async (req, res, next) => {
  try {
    const { category, status } = req.query;

    let query = supabase.from('vehicles').select('*').order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
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

const getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();

    if (vehicleError || !vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    const { data: rentals, error: rentalsError } = await supabase
      .from('rentals')
      .select('*')
      .eq('vehicle_id', id)
      .order('created_at', { ascending: false });

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

const createVehicle = async (req, res, next) => {
  try {
    const { brand, model, year, category, daily_rate, fuel_type, seating_capacity, status } = req.body;

    if (!brand || !model || !year || !category || daily_rate === undefined || !fuel_type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required vehicle fields: brand, model, year, category, daily_rate, fuel_type.'
      });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`
      });
    }

    if (Number(daily_rate) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'daily_rate must be a positive number greater than 0.'
      });
    }

    const vehicleStatus = status || 'available';
    if (!VALID_STATUSES.includes(vehicleStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    const newVehicle = {
      brand,
      model,
      year: Number(year),
      category,
      daily_rate: Number(daily_rate),
      fuel_type,
      seating_capacity: seating_capacity ? Number(seating_capacity) : 5,
      status: vehicleStatus
    };

    const { data, error } = await supabase
      .from('vehicles')
      .insert([newVehicle])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
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

const updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { brand, model, year, category, daily_rate, fuel_type, seating_capacity, status } = req.body;

    const { data: existing, error: checkError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    const updates = {};
    if (brand !== undefined) updates.brand = brand;
    if (model !== undefined) updates.model = model;
    if (year !== undefined) updates.year = Number(year);
    if (fuel_type !== undefined) updates.fuel_type = fuel_type;
    if (seating_capacity !== undefined) updates.seating_capacity = Number(seating_capacity);

    if (category !== undefined) {
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`
        });
      }
      updates.category = category;
    }

    if (daily_rate !== undefined) {
      if (Number(daily_rate) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'daily_rate must be a positive number greater than 0.'
        });
      }
      updates.daily_rate = Number(daily_rate);
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
        });
      }
      updates.status = status;
    }

    const { data, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
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

const deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: existing, error: checkError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    const { data: activeRentals, error: rentalError } = await supabase
      .from('rentals')
      .select('*')
      .eq('vehicle_id', id)
      .in('status', ['booked', 'active']);

    if (rentalError) {
      return res.status(400).json({ success: false, message: rentalError.message });
    }

    if (activeRentals && activeRentals.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Has Active Bookings. Cannot delete vehicle with active or upcoming bookings.'
      });
    }

    const { error: deleteError } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(400).json({ success: false, message: deleteError.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully'
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
