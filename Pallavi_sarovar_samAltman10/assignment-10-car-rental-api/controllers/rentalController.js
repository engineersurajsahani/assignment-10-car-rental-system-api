const supabase = require('../config/supabase');

function calculateDays(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

async function createRental(req, res, next) {
  try {
    const {
      vehicle_id,
      start_date,
      end_date,
      customer_name,
      customer_email
    } = req.body;

    if (!vehicle_id || !start_date || !end_date || !customer_name || !customer_email) {
      return res.status(400).json({ error: 'All booking fields are required' });
    }

    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ error: 'end_date must be on or after start_date' });
    }

    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicle_id)
      .single();

    if (vehicleError || !vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    if (vehicle.status !== 'available') {
      return res.status(400).json({ error: 'Vehicle is not available' });
    }

    // Date-overlap rule:
    // existing.start_date <= requested.end_date
    // AND existing.end_date >= requested.start_date
    const { data: conflicts, error: conflictError } = await supabase
      .from('rentals')
      .select('id, start_date, end_date')
      .eq('vehicle_id', vehicle_id)
      .in('status', ['booked', 'active'])
      .lte('start_date', end_date)
      .gte('end_date', start_date);

    if (conflictError) return res.status(400).json({ error: conflictError.message });

    if (conflicts && conflicts.length > 0) {
      return res.status(400).json({
        error: 'Vehicle already reserved during this timeframe'
      });
    }

    const days = calculateDays(start_date, end_date);
    const total_cost = days * Number(vehicle.daily_rate);

    const { data, error } = await supabase
      .from('rentals')
      .insert([{
        user_id: req.user.id,
        vehicle_id,
        customer_name,
        customer_email,
        start_date,
        end_date,
        total_cost,
        status: 'booked'
      }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({
      ...data,
      days,
      daily_rate: vehicle.daily_rate
    });
  } catch (error) {
    next(error);
  }
}

async function getMyBookings(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('rentals')
      .select('*, vehicles(*)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function cancelRental(req, res, next) {
  try {
    const { id } = req.params;

    const { data: rental, error: findError } = await supabase
      .from('rentals')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (findError || !rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    if (rental.status !== 'booked' || new Date(rental.start_date) <= new Date()) {
      return res.status(400).json({ error: 'Cannot Cancel' });
    }

    const { data, error } = await supabase
      .from('rentals')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function completeRental(req, res, next) {
  try {
    const { id } = req.params;

    const { data: rental, error: findError } = await supabase
      .from('rentals')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (findError || !rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    const { data, error } = await supabase
      .from('rentals')
      .update({ status: 'completed' })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    await supabase
      .from('vehicles')
      .update({ status: 'available' })
      .eq('id', rental.vehicle_id);

    res.json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createRental,
  getMyBookings,
  cancelRental,
  completeRental
};
