const { supabase } = require('../config/supabase');

/**
 * Helper to calculate number of rental days between two YYYY-MM-DD dates.
 * A 1-day rental (same start and end date) counts as 1 day minimum.
 * E.g., 2026-05-01 to 2026-05-05 = 4 days (or 5 days if inclusive).
 * Standard car rental billing computes (end - start) days; if 0, default 1 day.
 */
const calculateRentalDays = (startDateStr, endDateStr) => {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 0 ? 1 : diffDays;
};

/**
 * @desc    Book a vehicle (Validates date collision & computes dynamic server-side cost)
 * @route   POST /api/rentals
 * @access  Private
 */
const createRental = async (req, res, next) => {
  try {
    const { vehicle_id, start_date, end_date, customer_name, customer_email } = req.body;
    const userId = req.user.id;

    // 1. Validate required fields
    if (!vehicle_id || !start_date || !end_date || !customer_name || !customer_email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide vehicle_id, start_date, end_date, customer_name, and customer_email.',
      });
    }

    // 2. Validate date range logic (end_date must be >= start_date)
    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD.',
      });
    }

    if (endDateObj < startDateObj) {
      return res.status(400).json({
        success: false,
        error: 'end_date cannot be earlier than start_date.',
      });
    }

    // 3. Fetch vehicle details to verify existence, status, and get daily_rate
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicle_id)
      .single();

    if (vehicleError || !vehicle) {
      return res.status(404).json({
        success: false,
        error: `Vehicle with id ${vehicle_id} not found.`,
      });
    }

    if (vehicle.status === 'maintenance') {
      return res.status(400).json({
        success: false,
        error: `Vehicle ${vehicle.brand} ${vehicle.model} is currently under maintenance and unavailable for booking.`,
      });
    }

    // 4. DATE COLLISION PREVENTION ALGORITHM
    // Query existing rentals for the same vehicle with status in ('booked', 'active')
    // where date intervals overlap: (existing.start_date <= new.end_date AND existing.end_date >= new.start_date)
    const { data: overlappingRentals, error: collisionError } = await supabase
      .from('rentals')
      .select('id, vehicle_id, start_date, end_date, status, customer_name')
      .eq('vehicle_id', vehicle_id)
      .in('status', ['booked', 'active'])
      .lte('start_date', end_date)
      .gte('end_date', start_date);

    if (collisionError) {
      return res.status(500).json({
        success: false,
        error: collisionError.message,
      });
    }

    if (overlappingRentals && overlappingRentals.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle already reserved during this timeframe',
        conflicting_bookings: overlappingRentals,
      });
    }

    // 5. Automated Day Count & Server-Side Cost Computation
    const rentalDays = calculateRentalDays(start_date, end_date);
    const dailyRate = parseFloat(vehicle.daily_rate);
    const totalCost = Number((rentalDays * dailyRate).toFixed(2));

    // 6. Insert new rental booking into Supabase
    const { data: newRental, error: insertError } = await supabase
      .from('rentals')
      .insert([
        {
          user_id: userId,
          vehicle_id: parseInt(vehicle_id, 10),
          customer_name,
          customer_email,
          start_date,
          end_date,
          total_cost: totalCost,
          status: 'booked',
        },
      ])
      .select(`
        *,
        vehicles (
          id,
          brand,
          model,
          category,
          daily_rate
        )
      `)
      .single();

    if (insertError) {
      return res.status(400).json({
        success: false,
        error: insertError.message,
      });
    }

    // 7. Update vehicle status to 'rented'
    await supabase
      .from('vehicles')
      .update({ status: 'rented' })
      .eq('id', vehicle_id);

    return res.status(201).json({
      success: true,
      message: 'Vehicle booked successfully.',
      billing: {
        rental_days: rentalDays,
        daily_rate: dailyRate,
        total_cost: totalCost,
      },
      data: newRental,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all rentals/bookings for the authenticated customer
 * @route   GET /api/rentals/my-bookings
 * @access  Private
 */
const getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch rentals belonging to current authenticated user
    const { data: bookings, error } = await supabase
      .from('rentals')
      .select(`
        *,
        vehicles (
          id,
          brand,
          model,
          year,
          category,
          daily_rate,
          fuel_type,
          status
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      count: bookings ? bookings.length : 0,
      data: bookings || [],
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Cancel an upcoming rental
 * @route   PATCH /api/rentals/:id/cancel
 * @access  Private
 */
const cancelRental = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Fetch existing rental
    const { data: rental, error: fetchError } = await supabase
      .from('rentals')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !rental) {
      return res.status(404).json({
        success: false,
        error: `Rental booking with id ${id} not found.`,
      });
    }

    // Verify ownership (unless admin/system)
    if (rental.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have permission to cancel this booking.',
      });
    }

    // Cannot cancel if already completed or cancelled
    if (rental.status === 'cancelled' || rental.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: `Cannot cancel rental with status '${rental.status}'.`,
      });
    }

    // Cannot cancel if the rental has already started (start_date <= today)
    const todayStr = new Date().toISOString().split('T')[0];
    if (rental.start_date <= todayStr) {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel rental that has already started.',
      });
    }

    // Update rental status to 'cancelled'
    const { data: updatedRental, error: updateError } = await supabase
      .from('rentals')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({
        success: false,
        error: updateError.message,
      });
    }

    // Revert vehicle status to 'available' if no other active rental exists
    const { data: otherActiveRentals } = await supabase
      .from('rentals')
      .select('id')
      .eq('vehicle_id', rental.vehicle_id)
      .in('status', ['booked', 'active']);

    if (!otherActiveRentals || otherActiveRentals.length === 0) {
      await supabase
        .from('vehicles')
        .update({ status: 'available' })
        .eq('id', rental.vehicle_id);
    }

    return res.status(200).json({
      success: true,
      message: 'Rental booking cancelled successfully.',
      data: updatedRental,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Mark car as returned and complete rental
 * @route   PATCH /api/rentals/:id/complete
 * @access  Private
 */
const completeRental = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch existing rental
    const { data: rental, error: fetchError } = await supabase
      .from('rentals')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !rental) {
      return res.status(404).json({
        success: false,
        error: `Rental booking with id ${id} not found.`,
      });
    }

    if (rental.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Rental is already marked as completed.',
      });
    }

    if (rental.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Cannot complete a cancelled rental.',
      });
    }

    // Update rental status to 'completed'
    const { data: updatedRental, error: updateError } = await supabase
      .from('rentals')
      .update({ status: 'completed' })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({
        success: false,
        error: updateError.message,
      });
    }

    // Revert vehicle status back to 'available'
    await supabase
      .from('vehicles')
      .update({ status: 'available' })
      .eq('id', rental.vehicle_id);

    return res.status(200).json({
      success: true,
      message: 'Rental completed successfully. Vehicle marked as available.',
      data: updatedRental,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createRental,
  getMyBookings,
  cancelRental,
  completeRental,
};
