const supabase = require('../config/supabase');

exports.getVehicles = async (req, res) => {
  try {
    const { category, status } = req.query;
    let query = supabase.from('vehicles').select('*');

    if (category) {
      query = query.eq('category', category);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*, rentals(*)')
      .eq('id', id)
      .single();

    if (vehicleError || !vehicle) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    res.status(200).json(vehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addVehicle = async (req, res) => {
  try {
    const { brand, model, year, category, daily_rate, fuel_type, seating_capacity } = req.body;

    if (!brand || !model || !year || !category || !daily_rate || !fuel_type) {
      return res.status(400).json({ error: 'Missing required vehicle fields.' });
    }

    const { data, error } = await supabase
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
          status: 'available'
        }
      ])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: 'Vehicle added successfully', vehicle: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('vehicles')
      .update(req.body)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    res.status(200).json({ message: 'Vehicle updated successfully', vehicle: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: activeRentals, error: checkError } = await supabase
      .from('rentals')
      .select('*')
      .eq('vehicle_id', id)
      .in('status', ['booked', 'active']);

    if (checkError) {
      return res.status(400).json({ error: checkError.message });
    }

    if (activeRentals && activeRentals.length > 0) {
      return res.status(400).json({ error: 'Cannot delete vehicle with active or upcoming bookings.' });
    }

    const { data, error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    res.status(200).json({ message: 'Vehicle deleted successfully from fleet.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};