const supabase = require('../config/supabase');

// Create a rental
const createRental = async (req, res, next) => {
  try {
    const {
      vehicle_id,
      customer_name,
      customer_email,
      start_date,
      end_date
    } = req.body;

    if (
      !vehicle_id ||
      !customer_name ||
      !customer_email ||
      !start_date ||
      !end_date
    ) {
      return res.status(400).json({
        error: 'All rental fields are required'
      });
    }

    // Check that end date is not before start date
    const start = new Date(start_date);
    const end = new Date(end_date);

    if (end < start) {
      return res.status(400).json({
        error: 'End date must be on or after start date'
      });
    }

    // Get vehicle
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicle_id)
      .single();

    if (vehicleError || !vehicle) {
      return res.status(404).json({
        error: 'Vehicle not found'
      });
    }

    if (vehicle.status !== 'available') {
      return res.status(400).json({
        error: 'Vehicle is not available'
      });
    }

    // Check for overlapping bookings
    const { data: overlappingRentals, error: collisionError } =
      await supabase
        .from('rentals')
        .select('id, start_date, end_date, status')
        .eq('vehicle_id', vehicle_id)
        .not('status', 'in', '(cancelled,completed)')
        .lte('start_date', end_date)
        .gte('end_date', start_date);

    if (collisionError) {
      return next(collisionError);
    }

    if (overlappingRentals && overlappingRentals.length > 0) {
      return res.status(400).json({
        error: 'Vehicle is already booked for the selected dates',
        conflictingBookings: overlappingRentals
      });
    }

    // Calculate rental days
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const rentalDays = Math.max(
      1,
      Math.ceil((end - start) / millisecondsPerDay)
    );

    // Calculate total cost
    const totalCost = rentalDays * Number(vehicle.daily_rate);

    // Create rental
    const { data: rental, error: rentalError } = await supabase
      .from('rentals')
      .insert([
        {
          user_id: req.user.id,
          vehicle_id,
          customer_name,
          customer_email,
          start_date,
          end_date,
          total_cost: totalCost,
          status: 'booked'
        }
      ])
      .select()
      .single();

    if (rentalError) {
      return next(rentalError);
    }

    // Update vehicle status
    await supabase
      .from('vehicles')
      .update({ status: 'rented' })
      .eq('id', vehicle_id);

    res.status(201).json({
      message: 'Vehicle booked successfully',
      rental,
      rentalDays,
      dailyRate: vehicle.daily_rate,
      totalCost
    });
  } catch (error) {
    next(error);
  }
};


// Get logged-in user's bookings
const getMyBookings = async (req, res, next) => {
  try {
    const { data, error } = await supabase
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
          seating_capacity,
          status
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return next(error);
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
};


// Cancel a rental
const cancelRental = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: rental, error: rentalError } = await supabase
      .from('rentals')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (rentalError || !rental) {
      return res.status(404).json({
        error: 'Rental not found'
      });
    }

    if (rental.status === 'cancelled') {
      return res.status(400).json({
        error: 'Rental is already cancelled'
      });
    }

    if (rental.status === 'completed') {
      return res.status(400).json({
        error: 'Completed rental cannot be cancelled'
      });
    }

    const { data: updatedRental, error: updateError } = await supabase
      .from('rentals')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return next(updateError);
    }

    // Make vehicle available again
    await supabase
      .from('vehicles')
      .update({ status: 'available' })
      .eq('id', rental.vehicle_id);

    res.json({
      message: 'Rental cancelled successfully',
      rental: updatedRental
    });
  } catch (error) {
    next(error);
  }
};


// Complete a rental
const completeRental = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: rental, error: rentalError } = await supabase
      .from('rentals')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (rentalError || !rental) {
      return res.status(404).json({
        error: 'Rental not found'
      });
    }

    if (rental.status === 'completed') {
      return res.status(400).json({
        error: 'Rental is already completed'
      });
    }

    if (rental.status === 'cancelled') {
      return res.status(400).json({
        error: 'Cancelled rental cannot be completed'
      });
    }

    const { data: updatedRental, error: updateError } = await supabase
      .from('rentals')
      .update({ status: 'completed' })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return next(updateError);
    }

    // Make vehicle available again
    await supabase
      .from('vehicles')
      .update({ status: 'available' })
      .eq('id', rental.vehicle_id);

    res.json({
      message: 'Rental completed successfully',
      rental: updatedRental
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