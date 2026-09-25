const supabase = require('../config/supabase');

/**
 * Helper to calculate day difference between two YYYY-MM-DD date strings.
 * Minimum 1 day for same-day booking.
 */
const calculateRentalDays = (startDateStr, endDateStr) => {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 0 ? 1 : diffDays;
};

/**
 * Helper to format date as YYYY-MM-DD
 */
const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Check if a vehicle is available for the given date range (Collision Check)
 * Uses RPC 'check_vehicle_availability' if available, otherwise direct table query.
 */
const isVehicleAvailable = async (vehicleId, startDate, endDate, excludeRentalId = null) => {
  // Try calling the PostgreSQL RPC function
  try {
    const { data, error } = await supabase.rpc('check_vehicle_availability', {
      p_vehicle_id: vehicleId,
      p_start_date: startDate,
      p_end_date: endDate,
      p_exclude_rental_id: excludeRentalId
    });

    if (!error && typeof data === 'boolean') {
      return data;
    }
  } catch (rpcErr) {
    console.warn('[RPC availability check fallback to direct query]:', rpcErr.message);
  }

  // Fallback: Direct table collision query (start_date <= p_end_date AND end_date >= p_start_date)
  let query = supabase
    .from('rentals')
    .select('id')
    .eq('vehicle_id', vehicleId)
    .in('status', ['booked', 'active'])
    .lte('start_date', endDate)
    .gte('end_date', startDate);

  if (excludeRentalId) {
    query = query.neq('id', excludeRentalId);
  }

  const { data: conflicts, error } = await query;
  if (error) {
    throw error;
  }

  return !conflicts || conflicts.length === 0;
};

/**
 * Create a new rental booking (Collision-safe)
 * Route: POST /api/rentals
 * Access: Private (Auth required)
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

    // 1. Validate required inputs
    if (!vehicle_id || !start_date || !end_date || !customer_name || !customer_email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: vehicle_id, start_date, end_date, customer_name, customer_email are required'
      });
    }

    // 2. Validate date formats (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: start_date and end_date must be in YYYY-MM-DD format'
      });
    }

    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Invalid calendar dates provided'
      });
    }

    if (start_date > end_date) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: start_date cannot be after end_date'
      });
    }

    // 3. Fetch Vehicle details
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicle_id)
      .single();

    if (vehicleError || !vehicle) {
      return res.status(404).json({
        success: false,
        message: `Vehicle with ID ${vehicle_id} not found`
      });
    }

    if (vehicle.status === 'maintenance') {
      return res.status(400).json({
        success: false,
        message: 'Vehicle is currently under maintenance and not available for booking'
      });
    }

    // 4. Collision Check: Ensure no overlapping booked or active rentals
    const available = await isVehicleAvailable(vehicle_id, start_date, end_date);
    if (!available) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle already reserved during this timeframe'
      });
    }

    // 5. Server-Side Cost Calculation
    const rentalDays = calculateRentalDays(start_date, end_date);
    const totalCost = Number((rentalDays * parseFloat(vehicle.daily_rate)).toFixed(2));

    // 6. Insert Rental Row
    const { data: newRental, error: insertError } = await supabase
      .from('rentals')
      .insert([
        {
          user_id: req.user.id,
          vehicle_id: parseInt(vehicle_id, 10),
          customer_name: customer_name.trim(),
          customer_email: customer_email.trim().toLowerCase(),
          start_date,
          end_date,
          total_cost: totalCost,
          status: 'booked'
        }
      ])
      .select()
      .single();

    if (insertError) {
      return next(insertError);
    }

    // 7. Update vehicle status to 'rented' if booking starts today or in the past
    const todayStr = getTodayDateString();
    if (start_date <= todayStr && end_date >= todayStr) {
      await supabase
        .from('vehicles')
        .update({ status: 'rented' })
        .eq('id', vehicle_id);
    }

    return res.status(201).json({
      success: true,
      message: 'Rental booked successfully',
      data: {
        ...newRental,
        days_booked: rentalDays,
        daily_rate: vehicle.daily_rate,
        vehicle: {
          brand: vehicle.brand,
          model: vehicle.model,
          category: vehicle.category
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all rentals booked by current authenticated user
 * Route: GET /api/rentals/my-bookings
 * Access: Private (Auth required)
 */
const getMyBookings = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('rentals')
      .select(`
        id,
        user_id,
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
          category,
          daily_rate,
          fuel_type
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return next(error);
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

/**
 * Cancel a rental reservation
 * Route: PATCH /api/rentals/:id/cancel
 * Access: Private (Auth required)
 */
const cancelRental = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch rental verifying ownership (do not leak existence across users)
    const { data: rental, error: fetchError } = await supabase
      .from('rentals')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !rental) {
      return res.status(404).json({
        success: false,
        message: `Rental booking with ID ${id} not found`
      });
    }

    if (rental.status === 'completed' || rental.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a rental that is already ${rental.status}`
      });
    }

    const todayStr = getTodayDateString();
    if (rental.start_date < todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel rental after the reservation start date has passed'
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
      return next(updateError);
    }

    // Reset vehicle status back to 'available' if it was marked 'rented'
    await supabase
      .from('vehicles')
      .update({ status: 'available' })
      .eq('id', rental.vehicle_id)
      .eq('status', 'rented');

    return res.status(200).json({
      success: true,
      message: 'Rental cancelled successfully',
      data: updatedRental
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Mark a rental as completed
 * Route: PATCH /api/rentals/:id/complete
 * Access: Private (Auth required)
 */
const completeRental = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch rental verifying ownership
    const { data: rental, error: fetchError } = await supabase
      .from('rentals')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !rental) {
      return res.status(404).json({
        success: false,
        message: `Rental booking with ID ${id} not found`
      });
    }

    if (rental.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete a rental that has been cancelled'
      });
    }

    if (rental.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Rental is already marked as completed'
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
      return next(updateError);
    }

    // Reset vehicle status to 'available'
    await supabase
      .from('vehicles')
      .update({ status: 'available' })
      .eq('id', rental.vehicle_id);

    return res.status(200).json({
      success: true,
      message: 'Rental completed successfully',
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
