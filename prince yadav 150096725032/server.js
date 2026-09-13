const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { isConfigured } = require('./config/supabase');
const authRoutes = require('./routes/authRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const rentalRoutes = require('./routes/rentalRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// Middleware Configuration
// ==========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger in Development
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ==========================================
// Base & Health Check Endpoints
// ==========================================
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    project: 'ITM Assignment 10: Car Rental & Fleet Booking System API',
    student: 'Prince Yadav (150096725032)',
    status: 'Running',
    database: isConfigured ? 'Connected to Supabase PostgreSQL' : 'Simulation Mode (Configure .env for Supabase Cloud)',
    endpoints: {
      auth: ['POST /api/auth/register', 'POST /api/auth/login'],
      vehicles: [
        'GET /api/vehicles',
        'GET /api/vehicles/:id',
        'POST /api/vehicles (Auth)',
        'PUT /api/vehicles/:id (Auth)',
        'DELETE /api/vehicles/:id (Auth)'
      ],
      rentals: [
        'POST /api/rentals (Auth)',
        'GET /api/rentals/my-bookings (Auth)',
        'PATCH /api/rentals/:id/cancel (Auth)',
        'PATCH /api/rentals/:id/complete (Auth)'
      ]
    },
    documentation: '/README.md'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: isConfigured ? 'Supabase Connected' : 'Local In-Memory Mode'
  });
});

// ==========================================
// Route Mounts
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/rentals', rentalRoutes);

// ==========================================
// Error Handling
// ==========================================
app.use(notFound);
app.use(errorHandler);

// ==========================================
// Server Initialization
// ==========================================
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚗 Car Rental API Server running at http://localhost:${PORT}`);
    console.log(`👤 Student: Prince Yadav (150096725032)`);
    console.log(`📡 Database Mode: ${isConfigured ? 'Supabase Live Cloud' : 'Local Mock Simulator'}`);
  });
}

module.exports = app;
