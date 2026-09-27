const supabase = require('../config/supabase');

exports.getVehicles = async (req, res, next) => {
  try {
    const { category, status } = req.query;
    
    let query = supabase.from('vehicles').select('*');
    
    if (category) query = query.eq('category', category);
    if (status) query = query.eq('status', status);
    
    const { data, error } = await query;
    if (error) throw error;
    
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { data: vehicle, error: vError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();
      
    if (vError || !vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    
    const { data: rentals, error: rError } = await supabase
      .from('rentals')
      .select('*')
      .eq('vehicle_id', id)
      .order('start_date', { ascending: false });
      
    if (rError) throw rError;
    
    res.json({ ...vehicle, history: rentals });
  } catch (err) {
    next(err);
  }
};

exports.addVehicle = async (req, res, next) => {
  try {
    const { brand, model, year, category, daily_rate, fuel_type, seating_capacity } = req.body;
    
    if (!brand || !model || !year || !category || !daily_rate || !fuel_type) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const { data, error } = await supabase
      .from('vehicles')
      .insert([{ brand, model, year, category, daily_rate, fuel_type, seating_capacity }])
      .select();
      
    if (error) return res.status(400).json({ message: error.message });
    
    res.status(201).json(data[0]);
  } catch (err) {
    next(err);
  }
};

exports.updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { daily_rate, status } = req.body;
    
    const updates = {};
    if (daily_rate) updates.daily_rate = daily_rate;
    if (status) updates.status = status;
    
    const { data, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', id)
      .select();
      
    if (error || data.length === 0) return res.status(404).json({ message: 'Vehicle not found' });
    
    res.json(data[0]);
  } catch (err) {
    next(err);
  }
};

exports.deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check for active bookings
    const { data: activeRentals, error: rError } = await supabase
      .from('rentals')
      .select('*')
      .eq('vehicle_id', id)
      .in('status', ['booked', 'active']);
      
    if (rError) throw rError;
    if (activeRentals.length > 0) {
      return res.status(400).json({ message: 'Has Active Bookings' });
    }
    
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (err) {
    next(err);
  }
};
