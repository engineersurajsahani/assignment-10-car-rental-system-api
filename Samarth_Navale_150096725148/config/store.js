const supabase = require('./supabase');

const memoryVehicles = [
  {
    id: 1,
    brand: 'Tesla',
    model: 'Model 3',
    year: 2024,
    category: 'Electric',
    daily_rate: 4500,
    fuel_type: 'EV',
    seating_capacity: 5,
    status: 'available',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    brand: 'Toyota',
    model: 'Fortuner',
    year: 2023,
    category: 'SUV',
    daily_rate: 3500,
    fuel_type: 'Diesel',
    seating_capacity: 7,
    status: 'available',
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    brand: 'Honda',
    model: 'City',
    year: 2023,
    category: 'Sedan',
    daily_rate: 2000,
    fuel_type: 'Petrol',
    seating_capacity: 5,
    status: 'available',
    created_at: new Date().toISOString()
  }
];

const memoryRentals = [];
const memoryUsers = [];

module.exports = {
  supabase,
  memoryVehicles,
  memoryRentals,
  memoryUsers
};
