const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const rentalRoutes = require('./routes/rentalRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());

// Root Health / Status Route
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Car Rental & Vehicle Fleet Management API',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      vehicles: '/api/vehicles',
      rentals: '/api/rentals'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/rentals', rentalRoutes);

// 404 Not Found Handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚗 Car Rental API Server is running on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}`);
});

module.exports = app;
