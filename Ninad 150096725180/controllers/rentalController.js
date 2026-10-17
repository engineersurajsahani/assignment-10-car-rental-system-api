const supabase = require('../config/supabase');

exports.bookVehicle = async (req, res, next) => {
    try {
        const { vehicle_id, start_date, end_date, customer_name, customer_email } = req.body;
        const user_id = req.user.id;

        // 1. Validate dates
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        if (endDate < startDate) {
            return res.status(400).json({ error: 'End date must be after start date' });
        }

        // 2. Fetch vehicle details for daily rate
        const { data: vehicle, error: vehicleError } = await supabase
            .from('vehicles')
            .select('*')
            .eq('id', vehicle_id)
            .single();

        if (vehicleError || !vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        // 3. Collision Check (Date range overlap)
        const { data: conflicts, error: conflictError } = await supabase
            .from('rentals')
            .select('id')
            .eq('vehicle_id', vehicle_id)
            .in('status', ['booked', 'active'])
            .or(`and(start_date.lte.${end_date},end_date.gte.${start_date})`);

        if (conflictError) throw conflictError;
        
        if (conflicts && conflicts.length > 0) {
            return res.status(400).json({ error: 'Vehicle already reserved during this timeframe' });
        }

        // 4. Calculate Total Cost
        const msPerDay = 1000 * 60 * 60 * 24;
        const days = Math.ceil((endDate - startDate) / msPerDay) || 1; // Minimum 1 day
        const total_cost = days * vehicle.daily_rate;

        // 5. Create Rental
        const { data: rental, error: rentalError } = await supabase
            .from('rentals')
            .insert([{
                user_id,
                vehicle_id,
                customer_name,
                customer_email,
                start_date,
                end_date,
                total_cost,
                status: 'booked'
            }])
            .select();

        if (rentalError) return res.status(400).json({ error: rentalError.message });
        
        res.status(201).json({ data: rental[0] });
    } catch (error) {
        next(error);
    }
};

exports.myBookings = async (req, res, next) => {
    try {
        const user_id = req.user.id;
        const { data, error } = await supabase
            .from('rentals')
            .select('*, vehicles(*)')
            .eq('user_id', user_id);

        if (error) throw error;
        res.status(200).json({ data });
    } catch (error) {
        next(error);
    }
};

exports.cancelRental = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        const { data: rental } = await supabase
            .from('rentals')
            .select('*')
            .eq('id', id)
            .eq('user_id', user_id)
            .single();
            
        if (!rental) return res.status(404).json({ error: 'Rental not found' });
        if (rental.status !== 'booked') return res.status(400).json({ error: 'Cannot Cancel' });

        const { data, error } = await supabase
            .from('rentals')
            .update({ status: 'cancelled' })
            .eq('id', id)
            .select();

        if (error) throw error;
        res.status(200).json({ data: data[0] });
    } catch (error) {
        next(error);
    }
};

exports.completeRental = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const { data: rental, error: fetchError } = await supabase
            .from('rentals')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !rental) return res.status(404).json({ error: 'Rental not found' });

        // Update rental status
        const { data: updatedRental, error: updateError } = await supabase
            .from('rentals')
            .update({ status: 'completed' })
            .eq('id', id)
            .select();

        if (updateError) throw updateError;

        // Update vehicle status back to available
        await supabase
            .from('vehicles')
            .update({ status: 'available' })
            .eq('id', rental.vehicle_id);

        res.status(200).json({ data: updatedRental[0] });
    } catch (error) {
        next(error);
    }
};
