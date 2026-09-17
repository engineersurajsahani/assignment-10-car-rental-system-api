const supabase = require('../config/supabase');

function calculateDays(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  return Math.floor((end - start) / 86400000) + 1;
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
      return res.status(400).json({ error: 'Missing required booking fields' });
    }

    if (new Date(`${end_date}T00:00:00Z`) < new Date(`${start_date}T00:00:00Z`)) {
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

    if (vehicle.status === 'maintenance') {
      return res.status(400).json({ error: 'Vehicle is under maintenance' });
    }

    // Inclusive date-range collision:
    // existing.start <= requested.end AND existing.end >= requested.start
    const { data: conflicts, error: conflictError } = await supabase
      .from('rentals')
      .select('id, start_date, end_date')
      .eq('vehicle_id', vehicle_id)
      .in('status', ['booked', 'active'])
      .lte('start_date', end_date)
      .gte('end_date', start_date);

    if (conflictError) return res.status(500).json({ error: conflictError.message });

    if (conflicts?.length) {
      return res.status(400).json({
        error: 'Vehicle already reserved during this timeframe',
        conflicting_bookings: conflicts
      });
    }

    const days = calculateDays(start_date, end_date);
    const total_cost = Number((days * Number(vehicle.daily_rate)).toFixed(2));

    const { data: rental, error } = await supabase
      .from('rentals')
      .insert({
        user_id: req.user.id,
        vehicle_id,
        customer_name,
        customer_email,
        start_date,
        end_date,
        total_cost,
        status: 'booked'
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({
      message: 'Vehicle booked successfully',
      rental,
      calculation: {
        days,
        daily_rate: vehicle.daily_rate,
        total_cost
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getMyBookings(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('rentals')
      .select(`
        id,
        vehicle_id,
        customer_name,
        customer_email,
        start_date,
        end_date,
        total_cost,
        status,
        created_at,
        vehicles (
          brand,
          model,
          year,
          category,
          daily_rate,
          fuel_type
        )
      `)
      .eq('user_id', req.user.id)
      .order('start_date', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function cancelRental(req, res, next) {
  try {
    const { id } = req.params;

    const { data: rental, error } = await supabase
      .from('rentals')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !rental) return res.status(404).json({ error: 'Rental not found' });

    if (rental.status !== 'booked') {
      return res.status(400).json({ error: 'Cannot Cancel' });
    }

    const today = new Date();
    const start = new Date(`${rental.start_date}T00:00:00Z`);

    if (start < today) {
      return res.status(400).json({ error: 'Cannot Cancel' });
    }

    const { data, error: updateError } = await supabase
      .from('rentals')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (updateError) return res.status(400).json({ error: updateError.message });

    res.json({ message: 'Rental cancelled successfully', rental: data });
  } catch (error) {
    next(error);
  }
}

async function completeRental(req, res, next) {
  try {
    const { id } = req.params;

    const { data: rental, error } = await supabase
      .from('rentals')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !rental) return res.status(404).json({ error: 'Rental not found' });

    if (!['booked', 'active'].includes(rental.status)) {
      return res.status(400).json({ error: 'Rental cannot be completed' });
    }

    const { data, error: updateError } = await supabase
      .from('rentals')
      .update({ status: 'completed' })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (updateError) return res.status(400).json({ error: updateError.message });

    const { error: vehicleError } = await supabase
      .from('vehicles')
      .update({ status: 'available' })
      .eq('id', rental.vehicle_id);

    if (vehicleError) return res.status(500).json({ error: vehicleError.message });

    res.json({
      message: 'Rental completed and vehicle returned to available status',
      rental: data
    });
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