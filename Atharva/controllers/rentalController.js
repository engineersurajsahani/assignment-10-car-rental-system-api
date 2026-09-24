const supabase = require('../config/supabase');

exports.bookVehicle = async (req, res, next) => {
  try {
    const { vehicle_id, start_date, end_date, customer_name, customer_email } = req.body;
    const user_id = req.user.id;

    if (!vehicle_id || !start_date || !end_date || !customer_name || !customer_email) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (endDate < startDate) {
      return res.status(400).json({ success: false, message: 'End date cannot be before start date' });
    }

    // 1. Fetch vehicle to get daily_rate
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('daily_rate, status')
      .eq('id', vehicle_id)
      .single();

    if (vehicleError || !vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    
    if (vehicle.status === 'maintenance') {
      return res.status(400).json({ success: false, message: 'Vehicle is currently in maintenance' });
    }

    // 2. Check for date collisions
    const { data: collisions, error: collisionError } = await supabase
      .from('rentals')
      .select('id')
      .eq('vehicle_id', vehicle_id)
      .in('status', ['booked', 'active'])
      .or(`and(start_date.lte.${end_date},end_date.gte.${start_date})`);

    if (collisionError) throw collisionError;

    if (collisions && collisions.length > 0) {
      return res.status(400).json({ success: false, message: 'Vehicle already reserved during this timeframe' });
    }

    // 3. Compute total cost
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    const total_cost = diffDays * vehicle.daily_rate;

    // 4. Create rental record
    const { data, error } = await supabase
      .from('rentals')
      .insert([
        {
          user_id,
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

    if (error) throw error;

    res.status(201).json({ success: true, message: 'Vehicle booked successfully', data: data[0] });
  } catch (error) {
    next(error);
  }
};

exports.getMyBookings = async (req, res, next) => {
  try {
    const user_id = req.user.id;

    const { data, error } = await supabase
      .from('rentals')
      .select('*, vehicles(brand, model)')
      .eq('user_id', user_id);

    if (error) throw error;

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Ensure it belongs to user and is cancelable
    const { data: rental, error: fetchError } = await supabase
      .from('rentals')
      .select('status, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !rental) {
      return res.status(404).json({ success: false, message: 'Rental not found' });
    }

    if (rental.user_id !== user_id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (rental.status !== 'booked') {
      return res.status(400).json({ success: false, message: `Cannot cancel a rental with status: ${rental.status}` });
    }

    const { data, error } = await supabase
      .from('rentals')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select();

    if (error) throw error;

    res.status(200).json({ success: true, message: 'Booking cancelled successfully', data: data[0] });
  } catch (error) {
    next(error);
  }
};

exports.completeBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Assuming staff/admin normally does this, omitting role check for simplicity, just marking completed

    const { data: rental, error: fetchError } = await supabase
      .from('rentals')
      .select('vehicle_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !rental) {
      return res.status(404).json({ success: false, message: 'Rental not found' });
    }

    if (rental.status === 'cancelled' || rental.status === 'completed') {
       return res.status(400).json({ success: false, message: 'Rental is already completed or cancelled' });
    }

    // Complete the rental
    const { error: updateRentalError } = await supabase
      .from('rentals')
      .update({ status: 'completed' })
      .eq('id', id);

    if (updateRentalError) throw updateRentalError;

    // Make vehicle available again
    const { error: updateVehicleError } = await supabase
      .from('vehicles')
      .update({ status: 'available' })
      .eq('id', rental.vehicle_id);
      
    if (updateVehicleError) throw updateVehicleError;

    res.status(200).json({ success: true, message: 'Booking completed. Vehicle is now available.' });
  } catch (error) {
    next(error);
  }
};
