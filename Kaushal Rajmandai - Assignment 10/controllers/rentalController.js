const supabase = require('../config/supabase');

// POST /api/rentals (Auth required — collision check + cost calculation)
const createRental = async (req, res) => {
  try {
    const { vehicle_id, start_date, end_date, customer_name, customer_email } = req.body;

    if (!vehicle_id || !start_date || !end_date || !customer_name || !customer_email) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ message: 'end_date must be after start_date' });
    }

    // Fetch vehicle
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicle_id)
      .single();

    if (vehicleError || !vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (vehicle.status !== 'available') {
      return res.status(400).json({ message: `Vehicle is currently ${vehicle.status}` });
    }

    // Collision check: any existing booked/active rental for this vehicle
    // that overlaps the requested date range
    const { data: overlapping, error: overlapError } = await supabase
      .from('rentals')
      .select('id')
      .eq('vehicle_id', vehicle_id)
      .in('status', ['booked', 'active'])
      .lte('start_date', end_date)
      .gte('end_date', start_date);

    if (overlapError) {
      return res.status(500).json({ message: overlapError.message });
    }

    if (overlapping && overlapping.length > 0) {
      return res.status(400).json({
        message: 'Vehicle already reserved during this timeframe'
      });
    }

    // Calculate days & total cost
    const start = new Date(start_date);
    const end = new Date(end_date);
    const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
    const total_cost = days * parseFloat(vehicle.daily_rate);

    const { data: rental, error: rentalError } = await supabase
      .from('rentals')
      .insert([{
        user_id: req.user.id,
        vehicle_id,
        customer_name,
        customer_email,
        start_date,
        end_date,
        total_cost,
        status: 'booked'
      }])
      .select()
      .single();

    if (rentalError) return res.status(400).json({ message: rentalError.message });

    // Mark vehicle as rented
    await supabase.from('vehicles').update({ status: 'rented' }).eq('id', vehicle_id);

    res.status(201).json(rental);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/rentals/my-bookings (Auth required)
const getMyBookings = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rentals')
      .select('*, vehicles(brand, model, category)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ message: error.message });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/rentals/:id/cancel (Auth required)
const cancelRental = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: rental, error: fetchError } = await supabase
      .from('rentals')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    if (rental.status !== 'booked') {
      return res.status(400).json({ message: `Cannot cancel a rental with status '${rental.status}'` });
    }

    const { data: updated, error: updateError } = await supabase
      .from('rentals')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (updateError) return res.status(400).json({ message: updateError.message });

    // Free up the vehicle
    await supabase.from('vehicles').update({ status: 'available' }).eq('id', rental.vehicle_id);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/rentals/:id/complete (Auth required)
const completeRental = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: rental, error: fetchError } = await supabase
      .from('rentals')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    const { data: updated, error: updateError } = await supabase
      .from('rentals')
      .update({ status: 'completed' })
      .eq('id', id)
      .select()
      .single();

    if (updateError) return res.status(400).json({ message: updateError.message });

    // Vehicle returned -> available again
    await supabase.from('vehicles').update({ status: 'available' }).eq('id', rental.vehicle_id);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createRental, getMyBookings, cancelRental, completeRental };