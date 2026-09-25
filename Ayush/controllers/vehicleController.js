const { supabase } = require('../config/supabase');

const VALID_CATEGORIES = ['Sedan', 'SUV', 'Luxury', 'Hatchback', 'Electric'];
const VALID_STATUSES = ['available', 'rented', 'maintenance'];

async function getVehicles(req, res) {
  const { category, status } = req.query;

  let query = supabase.from('vehicles').select('*').order('id', { ascending: true });

  if (category) query = query.eq('category', category);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  return res.status(200).json({ success: true, count: data.length, data });
}

async function getVehicleById(req, res) {
  const { id } = req.params;

  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single();

  if (vehicleError || !vehicle) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }

  const { data: rentals, error: rentalsError } = await supabase
    .from('rentals')
    .select('*')
    .eq('vehicle_id', id)
    .order('start_date', { ascending: false });

  if (rentalsError) {
    return res.status(400).json({ success: false, message: rentalsError.message });
  }

  return res.status(200).json({
    success: true,
    data: { ...vehicle, rental_history: rentals },
  });
}

async function createVehicle(req, res) {
  const {
    brand,
    model,
    year,
    category,
    daily_rate,
    fuel_type,
    seating_capacity,
  } = req.body;

  if (!brand || !model || !year || !category || daily_rate === undefined || !fuel_type) {
    return res.status(400).json({
      success: false,
      message: 'brand, model, year, category, daily_rate and fuel_type are required',
    });
  }

  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({
      success: false,
      message: `category must be one of: ${VALID_CATEGORIES.join(', ')}`,
    });
  }

  if (Number(daily_rate) <= 0) {
    return res.status(400).json({ success: false, message: 'daily_rate must be greater than 0' });
  }

  const { data, error } = await req.supabase
    .from('vehicles')
    .insert([
      {
        brand,
        model,
        year,
        category,
        daily_rate,
        fuel_type,
        seating_capacity: seating_capacity || 5,
        status: 'available',
      },
    ])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  return res.status(201).json({ success: true, message: 'Vehicle added to fleet', data });
}

async function updateVehicle(req, res) {
  const { id } = req.params;
  const updates = {};

  const allowedFields = [
    'brand',
    'model',
    'year',
    'category',
    'daily_rate',
    'fuel_type',
    'seating_capacity',
    'status',
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, message: 'No valid fields provided to update' });
  }

  if (updates.category && !VALID_CATEGORIES.includes(updates.category)) {
    return res.status(400).json({
      success: false,
      message: `category must be one of: ${VALID_CATEGORIES.join(', ')}`,
    });
  }

  if (updates.status && !VALID_STATUSES.includes(updates.status)) {
    return res.status(400).json({
      success: false,
      message: `status must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }

  if (updates.daily_rate !== undefined && Number(updates.daily_rate) <= 0) {
    return res.status(400).json({ success: false, message: 'daily_rate must be greater than 0' });
  }

  const { data, error } = await req.supabase
    .from('vehicles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }

  return res.status(200).json({ success: true, message: 'Vehicle updated', data });
}

async function deleteVehicle(req, res) {
  const { id } = req.params;


  const { data: activeRentals, error: checkError } = await supabase
    .from('rentals')
    .select('id')
    .eq('vehicle_id', id)
    .in('status', ['booked', 'active']);

  if (checkError) {
    return res.status(400).json({ success: false, message: checkError.message });
  }

  if (activeRentals && activeRentals.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete vehicle: it has active or upcoming bookings',
    });
  }

  const { data, error } = await req.supabase
    .from('vehicles')
    .delete()
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }

  return res.status(200).json({ success: true, message: 'Vehicle removed from fleet' });
}

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};
