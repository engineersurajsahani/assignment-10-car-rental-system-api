const express = require('express');
const cors = require('cors');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const rentalRoutes = require('./routes/rentalRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Car Rental & Fleet Booking System API',
        version: '1.0.0',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                logout: 'POST /api/auth/logout (auth required)'
            },
            vehicles: {
                listVehicles: 'GET /api/vehicles',
                getVehicle: 'GET /api/vehicles/:id',
                addVehicle: 'POST /api/vehicles (auth required)',
                updateVehicle: 'PUT /api/vehicles/:id (auth required)',
                deleteVehicle: 'DELETE /api/vehicles/:id (auth required)'
            },
            rentals: {
                bookVehicle: 'POST /api/rentals (auth required)',
                myBookings: 'GET /api/rentals/my-bookings (auth required)',
                cancelBooking: 'PATCH /api/rentals/:id/cancel (auth required)',
                completeRental: 'PATCH /api/rentals/:id/complete (auth required)'
            }
        },
        filters: {
            vehicles: '?category=sedan&status=available',
            rentals: '?status=booked'
        }
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/rentals', rentalRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚗 Car Rental System API running on port ${PORT}`);
    console.log(`📖 API Documentation: http://localhost:${PORT}`);
});

module.exports = app;
