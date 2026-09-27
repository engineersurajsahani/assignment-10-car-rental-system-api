const supabase = require('../config/supabase');

exports.bookRental = async (req, res, next) => {
  try {
    const { vehicle_id, start_date, end_date, customer_name, customer_email } = req.body;
    const user_id = req.user.id;
    
    if (!vehicle_id || !start_date || !end_date || !customer_name || !customer_email) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // 1. Fetch Vehicle to calculate cost
    const { data: vehicle, error: vError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicle_id)
      .single();
      
    if (vError || !vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    
    // 2. Date Collision Check
    const { data: overlapping, error: overlapError } = await supabase
      .from('rentals')
      .select('id')
      .eq('vehicle_id', vehicle_id)
      .in('status', ['booked', 'active'])
      .lte('start_date', end_date)
      .gte('end_date', start_date);
      
    if (overlapError) throw overlapError;
    if (overlapping.length > 0) {
      return res.status(400).json({ message: 'Vehicle already reserved during this timeframe' });
    }

    // 3. Compute cost
    const days = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24)) + 1;
    const total_cost = days * vehicle.daily_rate;

    // 4. Create Rental
    const { data, error } = await supabase
      .from('rentals')
      .insert([{
        user_id,
        vehicle_id,
        customer_name,
        customer_email,
        start_date,
        end_date,
        total_cost
      }])
      .select();

    if (error) return res.status(400).json({ message: error.message });

    res.status(201).json(data[0]);
  } catch (err) {
    next(err);
  }
};

exports.getMyBookings = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { data, error } = await supabase
      .from('rentals')
      .select('*, vehicles(*)')
      .eq('user_id', user_id)
      .order('start_date', { ascending: false });
      
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const { data: rental, error: rError } = await supabase
      .from('rentals')
      .select('*')
      .eq('id', id)
      .single();

    if (rError || !rental) return res.status(404).json({ message: 'Rental not found' });
    
    // Allow cancellation only if booked (and maybe check if user_id matches or admin)
    if (rental.status !== 'booked') {
      return res.status(400).json({ message: 'Cannot cancel an active or completed rental' });
    }

    const { data, error } = await supabase
      .from('rentals')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json({ message: 'Booking cancelled successfully', rental: data[0] });
  } catch (err) {
    next(err);
  }
};

exports.completeBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: rental, error: rError } = await supabase
      .from('rentals')
      .select('*')
      .eq('id', id)
      .single();

    if (rError || !rental) return res.status(404).json({ message: 'Rental not found' });

    // Update rental status
    const { error } = await supabase
      .from('rentals')
      .update({ status: 'completed' })
      .eq('id', id);

    if (error) throw error;

    // Restore vehicle status
    await supabase
      .from('vehicles')
      .update({ status: 'available' })
      .eq('id', rental.vehicle_id);

    res.json({ message: 'Rental completed, vehicle is available' });
  } catch (err) {
    next(err);
  }
};
