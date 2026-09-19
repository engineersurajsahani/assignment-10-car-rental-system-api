require('dotenv').config();
const express = require('express');
const cors = require('cors');
const setupSwagger = require('./config/swagger');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const rentalRoutes = require('./routes/rentalRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger);

setupSwagger(app);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Car Rental & Fleet Management API is running',
    student: {
      name: 'Samarth Navale',
      roll_no: '150096725148',
      cohort: 'Sam Altman'
    },
    docs: '/api-docs',
    endpoints: {
      auth: ['POST /api/auth/register', 'POST /api/auth/login'],
      vehicles: [
        'GET /api/vehicles',
        'GET /api/vehicles/:id',
        'POST /api/vehicles',
        'PUT /api/vehicles/:id',
        'DELETE /api/vehicles/:id'
      ],
      rentals: [
        'POST /api/rentals',
        'GET /api/rentals/my-bookings',
        'PATCH /api/rentals/:id/cancel',
        'PATCH /api/rentals/:id/complete'
      ]
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/rentals', rentalRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
