const supabase = require('../config/supabase');

const getVehicles = async (req, res, next) => {
    try {
        const { category, status } = req.query;

        let query = supabase
            .from('vehicles')
            .select('*')
            .order('id', { ascending: true });

        if (category) {
            query = query.eq('category', category);
        }

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            return res.status(400).json({
                error: error.message
            });
        }

        res.json(data);
    } catch (error) {
        next(error);
    }
};

const getVehicleById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: vehicle, error: vehicleError } = await supabase
            .from('vehicles')
            .select('*')
            .eq('id', id)
            .single();

        if (vehicleError) {
            return res.status(404).json({
                error: 'Vehicle not found'
            });
        }

        const { data: rentals, error: rentalError } = await supabase
            .from('rentals')
            .select('*')
            .eq('vehicle_id', id)
            .order('start_date', { ascending: false });

        if (rentalError) {
            return res.status(400).json({
                error: rentalError.message
            });
        }

        res.json({
            vehicle,
            rentalHistory: rentals
        });
    } catch (error) {
        next(error);
    }
};

const createVehicle = async (req, res, next) => {
    try {
        const {
            brand,
            model,
            year,
            category,
            daily_rate,
            fuel_type,
            seating_capacity,
            status
        } = req.body;

        if (!brand || !model || !year || !category || !daily_rate || !fuel_type) {
            return res.status(400).json({
                error: 'brand, model, year, category, daily_rate, and fuel_type are required'
            });
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
                    status: status || 'available'
                }
            ])
            .select()
            .single();

        if (error) {
            return res.status(400).json({
                error: error.message
            });
        }

        res.status(201).json({
            message: 'Vehicle added successfully',
            vehicle: data
        });
    } catch (error) {
        next(error);
    }
};

const updateVehicle = async (req, res, next) => {
    try {
        const { id } = req.params;

        const {
            daily_rate,
            status
        } = req.body;

        if (daily_rate === undefined && status === undefined) {
            return res.status(400).json({
                error: 'daily_rate or status is required'
            });
        }

        const updates = {};

        if (daily_rate !== undefined) {
            updates.daily_rate = daily_rate;
        }

        if (status !== undefined) {
            updates.status = status;
        }

        const { data, error } = await supabase
            .from('vehicles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return res.status(400).json({
                error: error.message
            });
        }

        res.json({
            message: 'Vehicle updated successfully',
            vehicle: data
        });
    } catch (error) {
        next(error);
    }
};

const deleteVehicle = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: activeBookings, error: bookingError } = await supabase
            .from('rentals')
            .select('id')
            .eq('vehicle_id', id)
            .in('status', ['booked', 'active']);

        if (bookingError) {
            return res.status(400).json({
                error: bookingError.message
            });
        }

        if (activeBookings.length > 0) {
            return res.status(400).json({
                error: 'Vehicle cannot be deleted because it has active bookings'
            });
        }

        const { error } = await supabase
            .from('vehicles')
            .delete()
            .eq('id', id);

        if (error) {
            return res.status(400).json({
                error: error.message
            });
        }

        res.json({
            message: 'Vehicle deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getVehicles,
    getVehicleById,
    createVehicle,
    updateVehicle,
    deleteVehicle
};