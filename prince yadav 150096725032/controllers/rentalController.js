const { supabase, supabaseAdmin } = require('../config/supabase');

/**
 * Helper to calculate number of rental days
 * e.g., 2026-05-01 to 2026-05-05 is 4 days (or minimum 1 day for same-day return)
 */
const calculateRentalDays = (startDateStr, endDateStr) => {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(1, diffDays);
};

/**
 * @desc    Book a vehicle with collision prevention & dynamic cost billing
 * @route   POST /api/rentals
 * @access  Private (Auth Required)
 */
const createRental = async (req, res, next) => {
  try {
    const { vehicle_id, start_date, end_date, customer_name, customer_email } = req.body;
    const userId = req.user.id;

    // 1. Validation
    if (!vehicle_id || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide vehicle_id, start_date (YYYY-MM-DD), and end_date (YYYY-MM-DD).'
      });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please use YYYY-MM-DD format.'
      });
    }

    if (endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date range: end_date cannot be earlier than start_date.'
      });
    }

    // 2. Fetch Vehicle details
    const { data: vehicle, error: vehicleErr } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicle_id)
      .single();

    if (vehicleErr || !vehicle) {
      return res.status(404).json({
        success: false,
        message: `Vehicle with ID ${vehicle_id} not found.`
      });
    }

    if (vehicle.status === 'maintenance') {
      return res.status(400).json({
        success: false,
        message: `Vehicle #${vehicle_id} (${vehicle.brand} ${vehicle.model}) is currently in maintenance and cannot be reserved.`
      });
    }

    // 3. Date Collision Check Algorithm
    // Condition for collision: existing.start_date <= new_end AND existing.end_date >= new_start
    const { data: overlappingBookings, error: collisionErr } = await supabase
      .from('rentals')
      .select('id, start_date, end_date, status')
      .eq('vehicle_id', vehicle_id)
      .in('status', ['booked', 'active'])
      .lte('start_date', end_date)
      .gte('end_date', start_date);

    if (collisionErr) {
      return res.status(400).json({
        success: false,
        message: collisionErr.message
      });
    }

    if (overlappingBookings && overlappingBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle already reserved during this timeframe.',
        conflict: overlappingBookings[0]
      });
    }

    // 4. Automated Day Count & Cost Billing Computation
    const days = calculateRentalDays(start_date, end_date);
    const total_cost = Number((days * Number(vehicle.daily_rate)).toFixed(2));

    const rentalRecord = {
      user_id: userId,
      vehicle_id: Number(vehicle_id),
      customer_name: customer_name || req.user.user_metadata?.name || 'Customer',
      customer_email: customer_email || req.user.email,
      start_date,
      end_date,
      total_cost,
      status: 'booked'
    };

    const client = supabaseAdmin || supabase;
    const { data: newRental, error: insertErr } = await client
      .from('rentals')
      .insert(rentalRecord)
      .select()
      .single();

    if (insertErr) {
      return res.status(400).json({
        success: false,
        message: insertErr.message
      });
    }

    // Update vehicle status to rented
    await client
      .from('vehicles')
      .update({ status: 'rented' })
      .eq('id', vehicle_id);

    res.status(201).json({
      success: true,
      message: 'Vehicle booked successfully.',
      billing: {
        days_reserved: days,
        daily_rate: Number(vehicle.daily_rate),
        total_cost: total_cost
      },
      data: newRental
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List rentals for authenticated user with vehicle details
 * @route   GET /api/rentals/my-bookings
 * @access  Private (Auth Required)
 */
const getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('rentals')
      .select('*, vehicles(*)')
      .eq('user_id', userId)
      .order('id', { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(200).json({
      success: true,
      count: data ? data.length : 0,
      data: data || []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel upcoming rental
 * @route   PATCH /api/rentals/:id/cancel
 * @access  Private (Auth Required)
 */
const cancelRental = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Fetch booking
    const { data: rental, error: fetchErr } = await supabase
      .from('rentals')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !rental) {
      return res.status(404).json({
        success: false,
        message: `Booking record #${id} not found.`
      });
    }

    // Verify ownership (or admin bypass)
    if (rental.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this booking.'
      });
    }

    if (rental.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been cancelled.'
      });
    }

    if (rental.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a booking that has already been completed.'
      });
    }

    const client = supabaseAdmin || supabase;

    // Update rental status to cancelled
    const { data: updatedRental, error: updateErr } = await client
      .from('rentals')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      return res.status(400).json({
        success: false,
        message: updateErr.message
      });
    }

    // Set vehicle status back to available
    await client
      .from('vehicles')
      .update({ status: 'available' })
      .eq('id', rental.vehicle_id);

    res.status(200).json({
      success: true,
      message: `Booking #${id} has been cancelled successfully. Vehicle marked as available.`,
      data: updatedRental
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark car as returned (Sets vehicle status back to available)
 * @route   PATCH /api/rentals/:id/complete
 * @access  Private (Auth Required)
 */
const completeRental = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch booking
    const { data: rental, error: fetchErr } = await supabase
      .from('rentals')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !rental) {
      return res.status(404).json({
        success: false,
        message: `Booking record #${id} not found.`
      });
    }

    if (rental.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This rental is already marked as completed.'
      });
    }

    if (rental.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete a cancelled rental.'
      });
    }

    const client = supabaseAdmin || supabase;

    // Update rental status to completed
    const { data: updatedRental, error: updateErr } = await client
      .from('rentals')
      .update({ status: 'completed' })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      return res.status(400).json({
        success: false,
        message: updateErr.message
      });
    }

    // Transition vehicle back to available
    await client
      .from('vehicles')
      .update({ status: 'available' })
      .eq('id', rental.vehicle_id);

    res.status(200).json({
      success: true,
      message: `Vehicle returned! Rental #${id} completed and vehicle #${rental.vehicle_id} marked as available.`,
      data: updatedRental
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRental,
  getMyBookings,
  cancelRental,
  completeRental
};
