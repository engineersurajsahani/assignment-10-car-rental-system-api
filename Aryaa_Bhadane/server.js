require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/authRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const rentalRoutes = require('./routes/rentalRoutes');

// Import error handler middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check / API Root
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🚗 Car Rental & Vehicle Fleet Management API is running',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: ['/api/auth/register', '/api/auth/login'],
      vehicles: ['/api/vehicles', '/api/vehicles/:id'],
      rentals: ['/api/rentals', '/api/rentals/my-bookings', '/api/rentals/:id/cancel', '/api/rentals/:id/complete'],
    },
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/rentals', rentalRoutes);

// Catch-all 404 Handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Read port from environment variable for cloud deployment (e.g., Render)
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 Car Rental API Server running on port ${PORT}`);
    console.log(`📡 Local URL: http://localhost:${PORT}`);
    console.log(`=========================================`);
  });
}

module.exports = app;
