const supabase = require('../config/supabase');

async function getVehicles(req, res, next) {
  try {
    let query = supabase.from('vehicles').select('*').order('id');

    if (req.query.category) query = query.eq('category', req.query.category);
    if (req.query.status) query = query.eq('status', req.query.status);

    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });

    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function getVehicle(req, res, next) {
  try {
    const { id } = req.params;

    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const { data: rentals, error: rentalError } = await supabase
      .from('rentals')
      .select('id, user_id, customer_name, customer_email, start_date, end_date, total_cost, status, created_at')
      .eq('vehicle_id', id)
      .order('start_date', { ascending: false });

    if (rentalError) return res.status(500).json({ error: rentalError.message });

    res.json({ ...vehicle, rental_history: rentals });
  } catch (error) {
    next(error);
  }
}

async function createVehicle(req, res, next) {
  try {
    const { brand, model, year, category, daily_rate, fuel_type, seating_capacity } = req.body;

    if (!brand || !model || !year || !category || daily_rate == null || !fuel_type) {
      return res.status(400).json({ error: 'Missing required vehicle fields' });
    }

    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        brand,
        model,
        year,
        category,
        daily_rate,
        fuel_type,
        seating_capacity: seating_capacity || 5
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

async function updateVehicle(req, res, next) {
  try {
    const { id } = req.params;
    const allowed = ['brand', 'model', 'year', 'category', 'daily_rate', 'fuel_type', 'seating_capacity', 'status'];
    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'No valid fields supplied' });
    }

    const { data, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: error?.message || 'Vehicle not found' });

    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function deleteVehicle(req, res, next) {
  try {
    const { id } = req.params;

    const { data: activeBookings, error: bookingError } = await supabase
      .from('rentals')
      .select('id')
      .eq('vehicle_id', id)
      .in('status', ['booked', 'active']);

    if (bookingError) return res.status(500).json({ error: bookingError.message });

    if (activeBookings?.length) {
      return res.status(400).json({ error: 'Has Active Bookings' });
    }

    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle
};