const supabase = require('../config/supabase');
const getVehicles = async (req, res, next) => {
  try {
    const { category, status } = req.query;
    let query = supabase.from('vehicles').select('*').order('id', { ascending: true });
    if (category) query = query.eq('category', category);
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (error) { next(error); }
};
const getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: vehicle, error: vehicleError } = await supabase.from('vehicles').select('*').eq('id', id).single();
    if (vehicleError || !vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    const { data: rentals, error: rentalError } = await supabase.from('rentals').select('*').eq('vehicle_id', id).order('start_date', { ascending: true });
    if (rentalError) return res.status(500).json({ error: rentalError.message });
    res.json({ vehicle, rentals });
  } catch (error) { next(error); }
};
const createVehicle = async (req, res, next) => {
  try {
    const { brand, model, year, category, daily_rate, fuel_type, seating_capacity } = req.body;
    if (!brand || !model || !year || !category || !daily_rate || !fuel_type) return res.status(400).json({ error: 'brand, model, year, category, daily_rate and fuel_type are required' });
    const { data, error } = await supabase.from('vehicles').insert([{ brand, model, year, category, daily_rate, fuel_type, seating_capacity: seating_capacity || 5 }]).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (error) { next(error); }
};
const updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowed = ['brand','model','year','category','daily_rate','fuel_type','seating_capacity','status'];
    const updates = {};
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'No valid fields provided' });
    const { data, error } = await supabase.from('vehicles').update(updates).eq('id', id).select().single();
    if (error || !data) return res.status(404).json({ error: error?.message || 'Vehicle not found' });
    res.json(data);
  } catch (error) { next(error); }
};
const deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: activeBookings, error: bookingError } = await supabase.from('rentals').select('id').eq('vehicle_id', id).in('status', ['booked','active']);
    if (bookingError) return res.status(500).json({ error: bookingError.message });
    if (activeBookings?.length) return res.status(400).json({ error: 'Cannot delete vehicle with active bookings' });
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) { next(error); }
};
module.exports = { getVehicles, getVehicleById, createVehicle, updateVehicle, deleteVehicle };
