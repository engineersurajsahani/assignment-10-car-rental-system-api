const supabase = require('../config/supabase');

exports.getVehicles = async (req, res, next) => {
    try {
        const { category, status } = req.query;
        let query = supabase.from('vehicles').select('*');

        if (category) query = query.eq('category', category);
        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (error) throw error;

        res.status(200).json({ data });
    } catch (error) {
        next(error);
    }
};

exports.getVehicleById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('vehicles')
            .select(`
                *,
                rentals (*)
            `)
            .eq('id', id)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        res.status(200).json({ data });
    } catch (error) {
        next(error);
    }
};

exports.createVehicle = async (req, res, next) => {
    try {
        const { brand, model, year, category, daily_rate, fuel_type, seating_capacity } = req.body;
        const { data, error } = await supabase
            .from('vehicles')
            .insert([{ brand, model, year, category, daily_rate, fuel_type, seating_capacity }])
            .select();

        if (error) return res.status(400).json({ error: error.message });
        res.status(201).json({ data: data[0] });
    } catch (error) {
        next(error);
    }
};

exports.updateVehicle = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { daily_rate, status } = req.body;
        const { data, error } = await supabase
            .from('vehicles')
            .update({ daily_rate, status })
            .eq('id', id)
            .select();

        if (error) return res.status(400).json({ error: error.message });
        if (!data || data.length === 0) return res.status(404).json({ error: 'Vehicle not found' });

        res.status(200).json({ data: data[0] });
    } catch (error) {
        next(error);
    }
};

exports.deleteVehicle = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Check active bookings
        const { data: activeRentals, error: rentalError } = await supabase
            .from('rentals')
            .select('*')
            .eq('vehicle_id', id)
            .in('status', ['booked', 'active']);
            
        if (activeRentals && activeRentals.length > 0) {
            return res.status(400).json({ error: 'Has Active Bookings' });
        }

        const { error } = await supabase
            .from('vehicles')
            .delete()
            .eq('id', id);

        if (error) return res.status(400).json({ error: error.message });
        res.status(200).json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
        next(error);
    }
};
