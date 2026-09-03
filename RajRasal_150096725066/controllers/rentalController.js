const { supabase, isMock } = require('../config/supabase');

// Book a vehicle with date collision check and dynamic cost calculation
exports.createRental = async (req, res) => {
  try {
    const { vehicle_id, start_date, end_date, customer_name, customer_email } = req.body;
    const userId = req.user.id;

    if (!vehicle_id || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'vehicle_id, start_date, and end_date are required'
      });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date range. End date must be on or after start date.'
      });
    }

    // Calculate days span (inclusive)
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    let vehicle;
    if (!isMock && supabase.from) {
      const { data: vData, error: vErr } = await supabase.from('vehicles').select('*').eq('id', vehicle_id).single();
      if (vErr || !vData) return res.status(404).json({ success: false, message: 'Vehicle not found' });
      vehicle = vData;

      // Check date collisions: (start_date <= existing.end_date) AND (end_date >= existing.start_date)
      const { data: conflicts } = await supabase.from('rentals')
        .select('*')
        .eq('vehicle_id', vehicle_id)
        .in('status', ['booked', 'active'])
        .lte('start_date', end_date)
        .gte('end_date', start_date);

      if (conflicts && conflicts.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Vehicle already reserved during this timeframe'
        });
      }

      const totalCost = diffDays * Number(vehicle.daily_rate);
      const newRental = {
        user_id: userId,
        vehicle_id: Number(vehicle_id),
        customer_name: customer_name || req.user.name || 'Customer',
        customer_email: customer_email || req.user.email,
        start_date,
        end_date,
        total_cost: totalCost,
        status: 'booked',
        created_at: new Date().toISOString()
      };

      const { data: createdRental, error: rErr } = await supabase.from('rentals').insert([newRental]).select().single();
      if (rErr) return res.status(400).json({ success: false, message: rErr.message });

      return res.status(201).json({
        success: true,
        message: `Vehicle booked successfully for ${diffDays} day(s)`,
        data: createdRental
      });
    } else {
      vehicle = supabase.mockData.vehicles.find(v => v.id === Number(vehicle_id));
      if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

      // Collision check in mock
      const hasConflict = supabase.mockData.rentals.some(r => {
        if (r.vehicle_id !== Number(vehicle_id)) return false;
        if (!['booked', 'active'].includes(r.status)) return false;
        const rStart = new Date(r.start_date);
        const rEnd = new Date(r.end_date);
        return start <= rEnd && end >= rStart;
      });

      if (hasConflict) {
        return res.status(400).json({
          success: false,
          message: 'Vehicle already reserved during this timeframe'
        });
      }

      const totalCost = diffDays * Number(vehicle.daily_rate);
      const createdRental = {
        id: supabase.mockData.rentals.length + 1,
        user_id: userId,
        vehicle_id: Number(vehicle_id),
        customer_name: customer_name || req.user.name || 'David',
        customer_email: customer_email || req.user.email,
        start_date,
        end_date,
        total_cost: totalCost,
        status: 'booked',
        created_at: new Date().toISOString()
      };

      supabase.mockData.rentals.push(createdRental);

      return res.status(201).json({
        success: true,
        message: `Vehicle booked successfully for ${diffDays} day(s)`,
        data: createdRental
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// List rentals for authenticated user
exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!isMock && supabase.from) {
      const { data, error } = await supabase.from('rentals')
        .select('*, vehicles(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) return res.status(400).json({ success: false, message: error.message });
      return res.status(200).json({ success: true, count: data.length, data });
    } else {
      const rentals = supabase.mockData.rentals.filter(r => r.user_id === userId);
      const enriched = rentals.map(r => ({
        ...r,
        vehicle: supabase.mockData.vehicles.find(v => v.id === r.vehicle_id)
      }));
      return res.status(200).json({ success: true, count: enriched.length, data: enriched });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Cancel upcoming rental
exports.cancelRental = async (req, res) => {
  try {
    const rentalId = Number(req.params.id);

    if (!isMock && supabase.from) {
      const { data: rental, error } = await supabase.from('rentals').select('*').eq('id', rentalId).single();
      if (error || !rental) return res.status(404).json({ success: false, message: 'Rental not found' });

      if (rental.status === 'completed' || rental.status === 'cancelled') {
        return res.status(400).json({ success: false, message: `Cannot cancel a rental with status '${rental.status}'` });
      }

      const { data: updated, error: uErr } = await supabase.from('rentals')
        .update({ status: 'cancelled' })
        .eq('id', rentalId)
        .select()
        .single();

      if (uErr) return res.status(400).json({ success: false, message: uErr.message });
      return res.status(200).json({ success: true, message: 'Rental booking cancelled successfully', data: updated });
    } else {
      const rental = supabase.mockData.rentals.find(r => r.id === rentalId);
      if (!rental) return res.status(404).json({ success: false, message: 'Rental not found' });

      if (rental.status === 'completed' || rental.status === 'cancelled') {
        return res.status(400).json({ success: false, message: `Cannot cancel a rental with status '${rental.status}'` });
      }

      rental.status = 'cancelled';
      return res.status(200).json({ success: true, message: 'Rental booking cancelled successfully', data: rental });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Mark car as returned & completed
exports.completeRental = async (req, res) => {
  try {
    const rentalId = Number(req.params.id);

    if (!isMock && supabase.from) {
      const { data: rental, error } = await supabase.from('rentals').select('*').eq('id', rentalId).single();
      if (error || !rental) return res.status(404).json({ success: false, message: 'Rental not found' });

      await supabase.from('rentals').update({ status: 'completed' }).eq('id', rentalId);
      await supabase.from('vehicles').update({ status: 'available' }).eq('id', rental.vehicle_id);

      return res.status(200).json({
        success: true,
        message: 'Rental completed and vehicle marked as available'
      });
    } else {
      const rental = supabase.mockData.rentals.find(r => r.id === rentalId);
      if (!rental) return res.status(404).json({ success: false, message: 'Rental not found' });

      rental.status = 'completed';
      const vehicle = supabase.mockData.vehicles.find(v => v.id === rental.vehicle_id);
      if (vehicle) vehicle.status = 'available';

      return res.status(200).json({
        success: true,
        message: 'Rental completed and vehicle marked as available'
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
