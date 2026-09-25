const { supabase } = require('../config/supabase');

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysBetween(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.round((end - start) / MS_PER_DAY);

  return diff > 0 ? diff : 1;
}

function isValidDate(value) {
  return !isNaN(new Date(value).getTime());
}

async function createRental(req, res) {
  const { vehicle_id, start_date, end_date, customer_name, customer_email } = req.body;

  if (!vehicle_id || !start_date || !end_date || !customer_name || !customer_email) {
    return res.status(400).json({
      success: false,
      message:
        'vehicle_id, start_date, end_date, customer_name and customer_email are required',
    });
  }

  if (!isValidDate(start_date) || !isValidDate(end_date)) {
    return res.status(400).json({ success: false, message: 'Invalid start_date or end_date' });
  }

  if (new Date(end_date) < new Date(start_date)) {
    return res.status(400).json({ success: false, message: 'end_date cannot be before start_date' });
  }


  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', vehicle_id)
    .single();

  if (vehicleError || !vehicle) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }

  if (vehicle.status === 'maintenance') {
    return res.status(400).json({
      success: false,
      message: 'Vehicle is currently under maintenance and cannot be booked',
    });
  }




  const { data: overlapping, error: overlapError } = await supabase
    .from('rentals')
    .select('id, start_date, end_date, status')
    .eq('vehicle_id', vehicle_id)
    .in('status', ['booked', 'active'])
    .lte('start_date', end_date)
    .gte('end_date', start_date);

  if (overlapError) {
    return res.status(400).json({ success: false, message: overlapError.message });
  }

  if (overlapping && overlapping.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Vehicle already reserved during this timeframe',
      conflicts: overlapping,
    });
  }


  const days = daysBetween(start_date, end_date);
  const total_cost = Number((days * Number(vehicle.daily_rate)).toFixed(2));


  const { data: rental, error: insertError } = await req.supabase
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
        status: 'booked',
      },
    ])
    .select()
    .single();

  if (insertError) {
    return res.status(400).json({ success: false, message: insertError.message });
  }


  await supabase.from('vehicles').update({ status: 'rented' }).eq('id', vehicle_id);

  return res.status(201).json({
    success: true,
    message: 'Booking confirmed',
    data: { ...rental, days_booked: days },
  });
}

async function getMyBookings(req, res) {
  const { data, error } = await req.supabase
    .from('rentals')
    .select('*, vehicles(brand, model, category, daily_rate)')
    .eq('user_id', req.user.id)
    .order('start_date', { ascending: false });

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  return res.status(200).json({ success: true, count: data.length, data });
}

async function cancelRental(req, res) {
  const { id } = req.params;

  const { data: rental, error: fetchError } = await req.supabase
    .from('rentals')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !rental) {
    return res.status(404).json({ success: false, message: 'Rental not found' });
  }

  if (rental.status !== 'booked') {
    return res.status(400).json({
      success: false,
      message: `Cannot cancel a rental with status '${rental.status}'`,
    });
  }


  const today = new Date().toISOString().slice(0, 10);
  if (rental.start_date <= today) {
    return res.status(400).json({
      success: false,
      message: 'Cannot cancel a rental that has already started',
    });
  }

  const { data: updated, error: updateError } = await req.supabase
    .from('rentals')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return res.status(400).json({ success: false, message: updateError.message });
  }


  await supabase
    .from('vehicles')
    .update({ status: 'available' })
    .eq('id', rental.vehicle_id)
    .eq('status', 'rented');

  return res.status(200).json({ success: true, message: 'Rental cancelled', data: updated });
}

async function completeRental(req, res) {
  const { id } = req.params;

  const { data: rental, error: fetchError } = await req.supabase
    .from('rentals')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !rental) {
    return res.status(404).json({ success: false, message: 'Rental not found' });
  }

  if (!['booked', 'active'].includes(rental.status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot complete a rental with status '${rental.status}'`,
    });
  }

  const { data: updated, error: updateError } = await req.supabase
    .from('rentals')
    .update({ status: 'completed' })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return res.status(400).json({ success: false, message: updateError.message });
  }


  await supabase.from('vehicles').update({ status: 'available' }).eq('id', rental.vehicle_id);

  return res.status(200).json({
    success: true,
    message: 'Rental marked as completed. Vehicle is now available.',
    data: updated,
  });
}

module.exports = {
  createRental,
  getMyBookings,
  cancelRental,
  completeRental,
};
