const supabase = require('../config/supabase');

const createRental = async (req, res, next) => {
    try {
        const { vehicle_id, customer_name, customer_email, start_date, end_date } = req.body;
        const user_id = req.user.id;

        if (!vehicle_id || !customer_name || !customer_email || !start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: vehicle_id, customer_name, customer_email, start_date, end_date'
            });
        }

        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate < today) {
            return res.status(400).json({
                success: false,
                message: 'Start date cannot be in the past'
            });
        }

        if (endDate <= startDate) {
            return res.status(400).json({
                success: false,
                message: 'End date must be after start date'
            });
        }

        const { data: vehicle, error: vehicleError } = await supabase
            .from('vehicles')
            .select('*')
            .eq('id', vehicle_id)
            .single();

        if (vehicleError || !vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        if (vehicle.status !== 'available') {
            return res.status(400).json({
                success: false,
                message: `Vehicle is not available for booking. Current status: ${vehicle.status}`
            });
        }

        const { data: collisionRentals, error: collisionError } = await supabase
            .from('rentals')
            .select('id, start_date, end_date')
            .eq('vehicle_id', vehicle_id)
            .in('status', ['booked', 'active'])
            .or(`and(start_date.lte.${end_date},end_date.gte.${start_date})`);

        if (collisionError) {
            return res.status(400).json({
                success: false,
                message: 'Error checking date availability'
            });
        }

        if (collisionRentals && collisionRentals.length > 0) {
            const conflictingDates = collisionRentals.map(r => 
                `${r.start_date} to ${r.end_date}`
            ).join(', ');

            return res.status(409).json({
                success: false,
                message: `Vehicle is already booked for the requested dates`,
                conflictingBookings: collisionRentals
            });
        }

        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

        let total_cost = days * parseFloat(vehicle.daily_rate);
        let discount = 0;
        let discountReason = '';

        if (days >= 7 && days < 14) {
            discount = total_cost * 0.1;
            discountReason = '10% weekly discount applied';
        } else if (days >= 14) {
            discount = total_cost * 0.2;
            discountReason = '20% bi-weekly discount applied';
        }

        total_cost = total_cost - discount;

        const rentalData = {
            user_id,
            vehicle_id,
            customer_name,
            customer_email,
            start_date,
            end_date,
            total_cost: parseFloat(total_cost.toFixed(2)),
            status: 'booked'
        };

        const { data: rental, error: rentalError } = await supabase
            .from('rentals')
            .insert([rentalData])
            .select()
            .single();

        if (rentalError) {
            return res.status(400).json({
                success: false,
                message: rentalError.message
            });
        }

        await supabase
            .from('vehicles')
            .update({ status: 'rented' })
            .eq('id', vehicle_id);

        res.status(201).json({
            success: true,
            message: 'Rental booked successfully',
            data: {
                ...rental,
                billing: {
                    dailyRate: parseFloat(vehicle.daily_rate),
                    numberOfDays: days,
                    subtotal: days * parseFloat(vehicle.daily_rate),
                    discount: parseFloat(discount.toFixed(2)),
                    discountReason: discountReason || 'No discount applied',
                    totalCost: parseFloat(total_cost.toFixed(2))
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

const getMyBookings = async (req, res, next) => {
    try {
        const user_id = req.user.id;
        const { status } = req.query;

        let query = supabase
            .from('rentals')
            .select(`
                *,
                vehicles (
                    id,
                    brand,
                    model,
                    year,
                    category,
                    daily_rate,
                    fuel_type,
                    seating_capacity
                )
            `)
            .eq('user_id', user_id)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(200).json({
            success: true,
            count: data.length,
            data
        });
    } catch (error) {
        next(error);
    }
};

const cancelBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        const { data: rental, error: rentalError } = await supabase
            .from('rentals')
            .select('*')
            .eq('id', id)
            .eq('user_id', user_id)
            .single();

        if (rentalError || !rental) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found or unauthorized'
            });
        }

        if (!['booked', 'active'].includes(rental.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel booking with status: ${rental.status}`
            });
        }

        const { data: updatedRental, error: updateError } = await supabase
            .from('rentals')
            .update({ status: 'cancelled' })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            return res.status(400).json({
                success: false,
                message: updateError.message
            });
        }

        await supabase
            .from('vehicles')
            .update({ status: 'available' })
            .eq('id', rental.vehicle_id);

        res.status(200).json({
            success: true,
            message: 'Booking cancelled successfully',
            data: updatedRental
        });
    } catch (error) {
        next(error);
    }
};

const completeRental = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        const { data: rental, error: rentalError } = await supabase
            .from('rentals')
            .select('*')
            .eq('id', id)
            .eq('user_id', user_id)
            .single();

        if (rentalError || !rental) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found or unauthorized'
            });
        }

        if (!['booked', 'active'].includes(rental.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot complete booking with status: ${rental.status}`
            });
        }

        const { data: updatedRental, error: updateError } = await supabase
            .from('rentals')
            .update({ status: 'completed' })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            return res.status(400).json({
                success: false,
                message: updateError.message
            });
        }

        await supabase
            .from('vehicles')
            .update({ status: 'available' })
            .eq('id', rental.vehicle_id);

        res.status(200).json({
            success: true,
            message: 'Rental marked as returned/completed',
            data: updatedRental
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createRental,
    getMyBookings,
    cancelBooking,
    completeRental
};
