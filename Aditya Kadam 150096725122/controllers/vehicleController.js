const supabase = require('../config/supabase');

const getVehicles = async (req, res, next) => {
    try {
        const { category, status } = req.query;

        let query = supabase
            .from('vehicles')
            .select('*')
            .order('created_at', { ascending: false });

        if (category) {
            query = query.eq('category', category);
        }

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
                success: false,
                message: 'Vehicle not found'
            });
        }

        const { data: pastRentals, error: rentalsError } = await supabase
            .from('rentals')
            .select('id, customer_name, start_date, end_date, total_cost, status, created_at')
            .eq('vehicle_id', id)
            .order('created_at', { ascending: false })
            .limit(10);

        res.status(200).json({
            success: true,
            data: {
                ...vehicle,
                pastRentals: pastRentals || []
            }
        });
    } catch (error) {
        next(error);
    }
};

const createVehicle = async (req, res, next) => {
    try {
        const { brand, model, year, category, daily_rate, fuel_type, seating_capacity, status } = req.body;

        if (!brand || !model || !year || !category || !daily_rate || !fuel_type || !seating_capacity) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided: brand, model, year, category, daily_rate, fuel_type, seating_capacity'
            });
        }

        const validCategories = ['sedan', 'suv', 'hatchback', 'luxury', 'sports', 'van', 'pickup'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: `Invalid category. Valid categories: ${validCategories.join(', ')}`
            });
        }

        const validFuelTypes = ['petrol', 'diesel', 'electric', 'hybrid', 'cng'];
        if (!validFuelTypes.includes(fuel_type)) {
            return res.status(400).json({
                success: false,
                message: `Invalid fuel_type. Valid types: ${validFuelTypes.join(', ')}`
            });
        }

        const { data, error } = await supabase
            .from('vehicles')
            .insert([{
                brand,
                model,
                year,
                category,
                daily_rate,
                fuel_type,
                seating_capacity,
                status: status || 'available'
            }])
            .select()
            .single();

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: 'Vehicle created successfully',
            data
        });
    } catch (error) {
        next(error);
    }
};

const updateVehicle = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = {};

        const allowedFields = ['brand', 'model', 'year', 'category', 'daily_rate', 'fuel_type', 'seating_capacity', 'status'];
        
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        if (updateData.category) {
            const validCategories = ['sedan', 'suv', 'hatchback', 'luxury', 'sports', 'van', 'pickup'];
            if (!validCategories.includes(updateData.category)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid category. Valid categories: ${validCategories.join(', ')}`
                });
            }
        }

        if (updateData.fuel_type) {
            const validFuelTypes = ['petrol', 'diesel', 'electric', 'hybrid', 'cng'];
            if (!validFuelTypes.includes(updateData.fuel_type)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid fuel_type. Valid types: ${validFuelTypes.join(', ')}`
                });
            }
        }

        if (updateData.status) {
            const validStatuses = ['available', 'rented', 'maintenance'];
            if (!validStatuses.includes(updateData.status)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`
                });
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields provided for update'
            });
        }

        const { data, error } = await supabase
            .from('vehicles')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Vehicle updated successfully',
            data
        });
    } catch (error) {
        next(error);
    }
};

const deleteVehicle = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: activeRentals, error: checkError } = await supabase
            .from('rentals')
            .select('id')
            .eq('vehicle_id', id)
            .in('status', ['booked', 'active']);

        if (activeRentals && activeRentals.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete vehicle with active or booked rentals'
            });
        }

        const { error } = await supabase
            .from('vehicles')
            .delete()
            .eq('id', id);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(200).json({
            success: true,
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
