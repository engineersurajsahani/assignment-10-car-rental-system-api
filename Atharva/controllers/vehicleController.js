const supabase = require('../config/supabase');

exports.getVehicles = async (req, res, next) => {
  try {
    const { category, status } = req.query;
    
    let query = supabase.from('vehicles').select('*');
    
    if (category) {
      query = query.eq('category', category);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

exports.getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Fetch vehicle
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();

    if (vehicleError || !vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Fetch past rentals
    const { data: rentals, error: rentalsError } = await supabase
      .from('rentals')
      .select('*')
      .eq('vehicle_id', id);

    if (rentalsError) throw rentalsError;

    res.status(200).json({ success: true, data: { ...vehicle, rentals } });
  } catch (error) {
    next(error);
  }
};

exports.addVehicle = async (req, res, next) => {
  try {
    const { brand, model, year, category, daily_rate, fuel_type, seating_capacity } = req.body;
    
    if (!brand || !model || !year || !category || !daily_rate || !fuel_type) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('vehicles')
      .insert([
        { brand, model, year, category, daily_rate, fuel_type, seating_capacity }
      ])
      .select();

    if (error) throw error;

    res.status(201).json({ success: true, data: data[0] });
  } catch (error) {
    next(error);
  }
};

exports.updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { daily_rate, status } = req.body;

    const updates = {};
    if (daily_rate) updates.daily_rate = daily_rate;
    if (status) updates.status = status;

    const { data, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    res.status(200).json({ success: true, data: data[0] });
  } catch (error) {
    next(error);
  }
};

exports.deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if there are active bookings
    const { data: activeRentals, error: rentalError } = await supabase
      .from('rentals')
      .select('id')
      .eq('vehicle_id', id)
      .in('status', ['booked', 'active']);

    if (rentalError) throw rentalError;
    if (activeRentals && activeRentals.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete vehicle with active bookings' });
    }

    const { data, error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    res.status(200).json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    next(error);
  }
};
