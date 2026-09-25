const supabase = require('../config/supabase');

/**
 * Helper to calculate day difference between two dates (inclusive of minimum 1 day)
 */
const calculateRentalDays = (startDateStr, endDateStr) => {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  // Difference in milliseconds
  const diffTime = end.getTime() - start.getTime();
  // Convert to days
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // If start and end are on the same day, count as 1 day
  return diffDays === 0 ? 1 : diffDays;
};

/**
 * Book a vehicle rental
 * POST /api/rentals (Auth Required)
 * Body: { vehicle_id, start_date, end_date, customer_name, customer_email }
 */
const createRental = async (req, res, next) => {
  try {
    const {
      vehicle_id,
      start_date,
      end_date,
      customer_name,
      customer_email
    } = req.body;

    // Validate required fields
    if (!vehicle_id || !start_date || !end_date || !customer_name || !customer_email) {
      return res.status(400).json({
        error: 'Missing required fields: vehicle_id, start_date, end_date, customer_name, customer_email are required.'
      });
    }

    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format. Expected YYYY-MM-DD.'
      });
    }

    if (endDateObj < startDateObj) {
      return res.status(400).json({
        error: 'end_date cannot be earlier than start_date.'
      });
    }

    // 1. Fetch vehicle details to verify existence and fetch daily_rate
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicle_id)
      .single();

    if (vehicleError || !vehicle) {
      return res.status(404).json({
        error: `Vehicle with ID ${vehicle_id} not found.`
      });
    }

    if (vehicle.status === 'maintenance') {
      return res.status(400).json({
        error: 'Vehicle is currently under maintenance and cannot be booked.'
      });
    }

    // 2. Date-range collision check (inclusive overlap logic)
    // Overlap formula: (new.start_date <= existing.end_date) AND (new.end_date >= existing.start_date)
    // Filter against rentals with status in ('booked', 'active')
    const { data: collidingRentals, error: collisionError } = await supabase
      .from('rentals')
      .select('id, start_date, end_date, status')
      .eq('vehicle_id', vehicle_id)
      .in('status', ['booked', 'active'])
      .lte('start_date', end_date)
      .gte('end_date', start_date);

    if (collisionError) {
      return res.status(500).json({ error: collisionError.message });
    }

    if (collidingRentals && collidingRentals.length > 0) {
      return res.status(400).json({
        error: 'Vehicle already reserved during this timeframe.'
      });
    }

    // 3. Compute server-side total_cost
    const rentalDays = calculateRentalDays(start_date, end_date);
    const dailyRate = Number(vehicle.daily_rate);
    const total_cost = parseFloat((rentalDays * dailyRate).toFixed(2));

    // 4. Create the rental record
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
      .select()
      .single();

    if (insertError) {
      return res.status(400).json({ error: insertError.message });
    }

    // 5. Update vehicle status to 'rented' as part of the availability state machine
    await supabase
      .from('vehicles')
      .update({ status: 'rented' })
      .eq('id', vehicle_id);

    return res.status(201).json({
      message: 'Rental booking created successfully.',
      rental: newRental,
      calculation_details: {
        rental_days: rentalDays,
        daily_rate: dailyRate,
        total_cost
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all rentals for current authenticated user
 * GET /api/rentals/my-bookings (Auth Required)
 */
const getMyBookings = async (req, res, next) => {
  try {
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
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      count: bookings.length,
      bookings
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Cancel an upcoming rental booking
 * PATCH /api/rentals/:id/cancel (Auth Required)
 */
const cancelRental = async (req, res, next) => {
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
        error: `Rental booking with ID ${id} not found.`
      });
    }

    // Verify ownership
    if (rental.user_id !== req.user.id) {
      return res.status(403).json({
        error: 'Unauthorized. You can only cancel your own bookings.'
      });
    }

    // Check cancellation constraints
    if (rental.status === 'completed') {
      return res.status(400).json({
        error: 'Cannot cancel a rental that has already been completed.'
      });
    }

    if (rental.status === 'cancelled') {
      return res.status(400).json({
        error: 'Rental is already cancelled.'
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
      return res.status(400).json({ error: updateError.message });
    }

    // Revert vehicle status back to 'available'
    await supabase
      .from('vehicles')
      .update({ status: 'available' })
      .eq('id', rental.vehicle_id);

    return res.status(200).json({
      message: 'Rental booking cancelled successfully.',
      rental: updatedRental
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Mark a rental as completed and flip vehicle back to available
 * PATCH /api/rentals/:id/complete (Auth Required)
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
        error: `Rental booking with ID ${id} not found.`
      });
    }

    if (rental.status === 'completed') {
      return res.status(400).json({
        error: 'Rental is already marked as completed.'
      });
    }

    if (rental.status === 'cancelled') {
      return res.status(400).json({
        error: 'Cannot complete a cancelled rental.'
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
      return res.status(400).json({ error: updateError.message });
    }

    // Flip vehicle status back to 'available'
    await supabase
      .from('vehicles')
      .update({ status: 'available' })
      .eq('id', rental.vehicle_id);

    return res.status(200).json({
      message: 'Rental completed successfully. Vehicle marked as available.',
      rental: updatedRental
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
