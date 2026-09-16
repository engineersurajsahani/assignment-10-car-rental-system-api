const supabase = require('../config/supabase');

// GET /api/vehicles (Public — filter by category & status)
const getVehicles = async (req, res) => {
  try {
    const { category, status } = req.query;
    let query = supabase.from('vehicles').select('*');

    if (category) query = query.eq('category', category);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) return res.status(400).json({ message: error.message });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/vehicles/:id (Public — with rental history)
const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();

    if (vehicleError || !vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const { data: rentals, error: rentalsError } = await supabase
      .from('rentals')
      .select('*')
      .eq('vehicle_id', id)
      .order('start_date', { ascending: false });

    if (rentalsError) return res.status(400).json({ message: rentalsError.message });

    res.json({ ...vehicle, rental_history: rentals });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/vehicles (Auth required)
const addVehicle = async (req, res) => {
  try {
    const { brand, model, year, category, daily_rate, fuel_type, seating_capacity } = req.body;

    const { data, error } = await supabase
      .from('vehicles')
      .insert([{ brand, model, year, category, daily_rate, fuel_type, seating_capacity }])
      .select()
      .single();

    if (error) return res.status(400).json({ message: error.message });

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/vehicles/:id (Auth required)
const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('vehicles')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(400).json({ message: error.message });
    if (!data) return res.status(404).json({ message: 'Vehicle not found' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/vehicles/:id (Auth required)
const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: activeBookings } = await supabase
      .from('rentals')
      .select('id')
      .eq('vehicle_id', id)
      .in('status', ['booked', 'active']);

    if (activeBookings && activeBookings.length > 0) {
      return res.status(400).json({ message: 'Cannot delete vehicle with active bookings' });
    }

    const { error } = await supabase.from('vehicles').delete().eq('id', id);

    if (error) return res.status(400).json({ message: error.message });

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getVehicles, getVehicleById, addVehicle, updateVehicle, deleteVehicle };