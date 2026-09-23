const supabase = require('../config/supabase');
const getDays = (startDate, endDate) => {
  const start = new Date(`${startDate}T00:00:00Z`), end = new Date(`${endDate}T00:00:00Z`);
  return Math.floor((end - start) / 86400000) + 1;
};
const hasDateOverlap = async (vehicleId, startDate, endDate) => {
  const { data, error } = await supabase.from('rentals').select('id').eq('vehicle_id', vehicleId).in('status', ['booked','active']).lte('start_date', endDate).gte('end_date', startDate);
  if (error) throw new Error(error.message);
  return data?.length > 0;
};
const createRental = async (req, res, next) => {
  try {
    const { vehicle_id, start_date, end_date, customer_name, customer_email } = req.body;
    if (!vehicle_id || !start_date || !end_date || !customer_name || !customer_email) return res.status(400).json({ error: 'vehicle_id, start_date, end_date, customer_name and customer_email are required' });
    if (new Date(`${end_date}T00:00:00Z`) < new Date(`${start_date}T00:00:00Z`)) return res.status(400).json({ error: 'end_date cannot be before start_date' });
    const { data: vehicle, error: vehicleError } = await supabase.from('vehicles').select('*').eq('id', vehicle_id).single();
    if (vehicleError || !vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    if (vehicle.status !== 'available') return res.status(400).json({ error: `Vehicle is currently ${vehicle.status}` });
    if (await hasDateOverlap(vehicle_id, start_date, end_date)) return res.status(400).json({ error: 'Vehicle already reserved during this timeframe' });
    const days = getDays(start_date, end_date), total_cost = Number(vehicle.daily_rate) * days;
    const { data: rental, error: rentalError } = await supabase.from('rentals').insert([{ user_id: req.user.id, vehicle_id, customer_name, customer_email, start_date, end_date, total_cost, status: 'booked' }]).select().single();
    if (rentalError) return res.status(400).json({ error: rentalError.message });
    res.status(201).json({ message: 'Vehicle booked successfully', rental, days, daily_rate: vehicle.daily_rate, total_cost });
  } catch (error) { next(error); }
};
const getMyBookings = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('rentals').select('*, vehicles(*)').eq('user_id', req.user.id).order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (error) { next(error); }
};
const cancelRental = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: rental, error: findError } = await supabase.from('rentals').select('*').eq('id', id).eq('user_id', req.user.id).single();
    if (findError || !rental) return res.status(404).json({ error: 'Rental not found' });
    if (rental.status !== 'booked') return res.status(400).json({ error: 'Only upcoming booked rentals can be cancelled' });
    const { data, error } = await supabase.from('rentals').update({ status: 'cancelled' }).eq('id', id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Rental cancelled successfully', rental: data });
  } catch (error) { next(error); }
};
const completeRental = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: rental, error: findError } = await supabase.from('rentals').select('*').eq('id', id).eq('user_id', req.user.id).single();
    if (findError || !rental) return res.status(404).json({ error: 'Rental not found' });
    if (!['booked','active'].includes(rental.status)) return res.status(400).json({ error: 'Only booked or active rentals can be completed' });
    const { data: updatedRental, error: rentalError } = await supabase.from('rentals').update({ status: 'completed' }).eq('id', id).select().single();
    if (rentalError) return res.status(400).json({ error: rentalError.message });
    const { data: updatedVehicle, error: vehicleError } = await supabase.from('vehicles').update({ status: 'available' }).eq('id', rental.vehicle_id).select().single();
    if (vehicleError) return res.status(400).json({ error: vehicleError.message });
    res.json({ message: 'Rental completed and vehicle is available again', rental: updatedRental, vehicle: updatedVehicle });
  } catch (error) { next(error); }
};
module.exports = { createRental, getMyBookings, cancelRental, completeRental };
