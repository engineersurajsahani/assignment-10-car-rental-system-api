const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const rentalRoutes = require('./routes/rentalRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🚗 Car Rental & Vehicle Fleet Management API with Supabase',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login'
      },
      vehicles: {
        getAll: 'GET /api/vehicles',
        getOne: 'GET /api/vehicles/:id',
        create: 'POST /api/vehicles (Auth Required)',
        update: 'PUT /api/vehicles/:id (Auth Required)',
        delete: 'DELETE /api/vehicles/:id (Auth Required)'
      },
      rentals: {
        create: 'POST /api/rentals (Auth Required)',
        myBookings: 'GET /api/rentals/my-bookings (Auth Required)',
        cancel: 'PATCH /api/rentals/:id/cancel (Auth Required)',
        complete: 'PATCH /api/rentals/:id/complete (Auth Required)'
      }
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/rentals', rentalRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Car Rental API Server running on port ${PORT}`);
    console.log(`📍 API Base URL: http://localhost:${PORT}/api`);
  });
}

module.exports = app;
