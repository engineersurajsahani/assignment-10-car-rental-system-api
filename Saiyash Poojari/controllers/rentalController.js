const supabase = require('../config/supabase');

const createRental = async (req, res, next) => {
  try {
    const { vehicle_id, start_date, end_date, customer_name, customer_email } = req.body;
    const userId = req.user.id;

    if (!vehicle_id || !start_date || !end_date || !customer_name || !customer_email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required rental fields: vehicle_id, start_date, end_date, customer_name, customer_email.'
      });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start_date or end_date format. Please use YYYY-MM-DD format.'
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'end_date cannot be earlier than start_date.'
      });
    }

    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicle_id)
      .single();

    if (vehicleError || !vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    if (vehicle.status === 'maintenance') {
      return res.status(400).json({
        success: false,
        message: 'Vehicle is currently under maintenance and cannot be rented.'
      });
    }

    const { data: existingRentals, error: rentalQueryError } = await supabase
      .from('rentals')
      .select('*')
      .eq('vehicle_id', vehicle_id)
      .in('status', ['booked', 'active']);

    if (rentalQueryError) {
      return res.status(400).json({ success: false, message: rentalQueryError.message });
    }

    const formattedStart = start_date.slice(0, 10);
    const formattedEnd = end_date.slice(0, 10);

    const hasCollision = existingRentals && existingRentals.some((r) => {
      const existingStart = r.start_date.slice(0, 10);
      const existingEnd = r.end_date.slice(0, 10);
      return formattedStart <= existingEnd && formattedEnd >= existingStart;
    });

    if (hasCollision) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle already reserved during this timeframe.'
      });
    }

    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const daySpan = diffDays === 0 ? 1 : diffDays;
    const total_cost = Number((daySpan * Number(vehicle.daily_rate)).toFixed(2));

    const newRental = {
      user_id: userId,
      vehicle_id: Number(vehicle_id),
      customer_name,
      customer_email,
      start_date: formattedStart,
      end_date: formattedEnd,
      total_cost,
      status: 'booked'
    };

    const { data: rentalData, error: createError } = await supabase
      .from('rentals')
      .insert([newRental])
      .select()
      .single();

    if (createError) {
      return res.status(400).json({ success: false, message: createError.message });
    }

    await supabase
      .from('vehicles')
      .update({ status: 'rented' })
      .eq('id', vehicle_id);

    return res.status(201).json({
      success: true,
      message: 'Rental booked successfully',
      day_span: daySpan,
      daily_rate: Number(vehicle.daily_rate),
      data: rentalData
    });
  } catch (err) {
    next(err);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('rentals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

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

const cancelRental = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: rental, error: fetchError } = await supabase
      .from('rentals')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    if (rental.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot Cancel. Rental is already cancelled.'
      });
    }

    if (rental.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot Cancel. Completed rentals cannot be cancelled.'
      });
    }

    const { data: updatedRental, error: updateError } = await supabase
      .from('rentals')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ success: false, message: updateError.message });
    }

    const { data: otherActive } = await supabase
      .from('rentals')
      .select('*')
      .eq('vehicle_id', rental.vehicle_id)
      .in('status', ['booked', 'active']);

    if (!otherActive || otherActive.length === 0) {
      await supabase
        .from('vehicles')
        .update({ status: 'available' })
        .eq('id', rental.vehicle_id);
    }

    return res.status(200).json({
      success: true,
      message: 'Rental cancelled successfully',
      data: updatedRental
    });
  } catch (err) {
    next(err);
  }
};

const completeRental = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: rental, error: fetchError } = await supabase
      .from('rentals')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    if (rental.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Rental is already completed.'
      });
    }

    if (rental.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cancelled rental cannot be completed.'
      });
    }

    const { data: updatedRental, error: updateError } = await supabase
      .from('rentals')
      .update({ status: 'completed' })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ success: false, message: updateError.message });
    }

    await supabase
      .from('vehicles')
      .update({ status: 'available' })
      .eq('id', rental.vehicle_id);

    return res.status(200).json({
      success: true,
      message: 'Rental marked as completed. Car returned and set to available.',
      data: updatedRental
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createRental,
  getMyBookings,
  cancelRental,
  completeRental
};
