const { supabase, isMock } = require('../config/supabase');

// Get all vehicles with optional filters
exports.getAllVehicles = async (req, res) => {
  try {
    const { category, status, fuel_type } = req.query;

    if (!isMock && supabase.from) {
      let query = supabase.from('vehicles').select('*');
      if (category) query = query.ilike('category', category);
      if (status) query = query.eq('status', status);
      if (fuel_type) query = query.ilike('fuel_type', fuel_type);

      const { data, error } = await query;
      if (error) return res.status(400).json({ success: false, message: error.message });

      return res.status(200).json({ success: true, count: data.length, data });
    } else {
      let vehicles = [...supabase.mockData.vehicles];
      if (category) vehicles = vehicles.filter(v => v.category.toLowerCase() === category.toLowerCase());
      if (status) vehicles = vehicles.filter(v => v.status.toLowerCase() === status.toLowerCase());
      if (fuel_type) vehicles = vehicles.filter(v => v.fuel_type.toLowerCase() === fuel_type.toLowerCase());

      return res.status(200).json({ success: true, count: vehicles.length, data: vehicles });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get single vehicle with rental history
exports.getVehicleById = async (req, res) => {
  try {
    const vehicleId = Number(req.params.id);

    if (!isMock && supabase.from) {
      const { data: vehicle, error: vErr } = await supabase.from('vehicles').select('*').eq('id', vehicleId).single();
      if (vErr || !vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

      const { data: rentals } = await supabase.from('rentals').select('*').eq('vehicle_id', vehicleId);
      return res.status(200).json({ success: true, data: { ...vehicle, rentals: rentals || [] } });
    } else {
      const vehicle = supabase.mockData.vehicles.find(v => v.id === vehicleId);
      if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

      const rentals = supabase.mockData.rentals.filter(r => r.vehicle_id === vehicleId);
      return res.status(200).json({ success: true, data: { ...vehicle, rentals } });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Add new vehicle
exports.createVehicle = async (req, res) => {
  try {
    const { brand, model, year, category, daily_rate, fuel_type, seating_capacity } = req.body;

    if (!brand || !model || !year || !category || !daily_rate || !fuel_type) {
      return res.status(400).json({
        success: false,
        message: 'brand, model, year, category, daily_rate, and fuel_type are required'
      });
    }

    const newVehicleData = {
      brand: brand.trim(),
      model: model.trim(),
      year: Number(year),
      category,
      daily_rate: Number(daily_rate),
      fuel_type: fuel_type.trim(),
      seating_capacity: seating_capacity ? Number(seating_capacity) : 5,
      status: 'available',
      created_at: new Date().toISOString()
    };

    if (!isMock && supabase.from) {
      const { data, error } = await supabase.from('vehicles').insert([newVehicleData]).select().single();
      if (error) return res.status(400).json({ success: false, message: error.message });
      return res.status(201).json({ success: true, message: 'Vehicle added to fleet', data });
    } else {
      const newVehicle = {
        id: supabase.mockData.vehicles.length + 1,
        ...newVehicleData
      };
      supabase.mockData.vehicles.push(newVehicle);
      return res.status(201).json({ success: true, message: 'Vehicle added to fleet', data: newVehicle });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update vehicle daily rate or status
exports.updateVehicle = async (req, res) => {
  try {
    const vehicleId = Number(req.params.id);
    const updates = req.body;

    if (!isMock && supabase.from) {
      const { data, error } = await supabase.from('vehicles').update(updates).eq('id', vehicleId).select().single();
      if (error || !data) return res.status(404).json({ success: false, message: error?.message || 'Vehicle not found' });
      return res.status(200).json({ success: true, message: 'Vehicle updated successfully', data });
    } else {
      const vehicle = supabase.mockData.vehicles.find(v => v.id === vehicleId);
      if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

      Object.assign(vehicle, updates);
      return res.status(200).json({ success: true, message: 'Vehicle updated successfully', data: vehicle });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete vehicle from fleet
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicleId = Number(req.params.id);

    if (!isMock && supabase.from) {
      // Check active bookings
      const { data: activeRentals } = await supabase.from('rentals')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .in('status', ['booked', 'active']);

      if (activeRentals && activeRentals.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete vehicle with active or upcoming bookings'
        });
      }

      const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId);
      if (error) return res.status(400).json({ success: false, message: error.message });

      return res.status(200).json({ success: true, message: 'Vehicle deleted from fleet successfully' });
    } else {
      const activeRentals = supabase.mockData.rentals.filter(
        r => r.vehicle_id === vehicleId && (r.status === 'booked' || r.status === 'active')
      );

      if (activeRentals.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete vehicle with active or upcoming bookings'
        });
      }

      const index = supabase.mockData.vehicles.findIndex(v => v.id === vehicleId);
      if (index === -1) return res.status(404).json({ success: false, message: 'Vehicle not found' });

      supabase.mockData.vehicles.splice(index, 1);
      return res.status(200).json({ success: true, message: 'Vehicle deleted from fleet successfully' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
