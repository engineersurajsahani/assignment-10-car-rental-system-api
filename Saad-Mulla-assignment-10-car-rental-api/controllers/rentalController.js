const supabase = require('../config/supabase');

exports.createRental = async (req, res) => {
  try {
    const { vehicle_id, start_date, end_date, customer_name, customer_email } = req.body;

    if (!vehicle_id || !start_date || !end_date || !customer_name || !customer_email) {
      return res.status(400).json({ error: 'All rental details are required.' });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);

    if (end < start) {
      return res.status(400).json({ error: 'End date must be equal to or after start date.' });
    }

    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicle_id)
      .single();

    if (vehicleError || !vehicle) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    if (vehicle.status === 'maintenance') {
      return res.status(400).json({ error: 'Vehicle is currently under maintenance.' });
    }

    const { data: collisions, error: collisionError } = await supabase
      .from('rentals')
      .select('*')
      .eq('vehicle_id', vehicle_id)
      .in('status', ['booked', 'active'])
      .lte('start_date', end_date)
      .gte('end_date', start_date);

    if (collisionError) {
      return res.status(400).json({ error: collisionError.message });
    }

    if (collisions && collisions.length > 0) {
      return res.status(400).json({ error: 'Vehicle already reserved during this timeframe.' });
    }

    const diffTime = Math.abs(end - start);
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const total_cost = diffDays * Number(vehicle.daily_rate);

    const { data: newRental, error: insertError } = await supabase
      .from('rentals')
      .insert([
        {
          user_id: req.user.id,
          vehicle_id,
          customer_name,
          customer_email,
          start_date,
          end_date,
          total_cost,
          status: 'booked'
        }
      ])
      .select();

    if (insertError) {
      return res.status(400).json({ error: insertError.message });
    }

    res.status(201).json({
      message: 'Vehicle booked successfully',
      rental: newRental[0],
      durationDays: diffDays,
      dailyRate: vehicle.daily_rate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rentals')
      .select('*, vehicles(*)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cancelRental = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: rental, error: fetchError } = await supabase
      .from('rentals')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !rental) {
      return res.status(404).json({ error: 'Rental booking not found or unauthorized.' });
    }

    if (rental.status === 'completed' || rental.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot cancel a booking that is already ' + rental.status + '.' });
    }

    const { data, error } = await supabase
      .from('rentals')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    await supabase.from('vehicles').update({ status: 'available' }).eq('id', rental.vehicle_id);

    res.status(200).json({ message: 'Rental booking cancelled successfully', rental: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.completeRental = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: rental, error: fetchError } = await supabase
      .from('rentals')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !rental) {
      return res.status(404).json({ error: 'Rental booking not found.' });
    }

    const { data, error } = await supabase
      .from('rentals')
      .update({ status: 'completed' })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    await supabase.from('vehicles').update({ status: 'available' }).eq('id', rental.vehicle_id);

    res.status(200).json({ message: 'Rental completed and vehicle marked as available.', rental: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};