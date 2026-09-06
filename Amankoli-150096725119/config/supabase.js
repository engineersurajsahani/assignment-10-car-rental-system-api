const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://sample-project.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sample-anon-key';

let supabase;
let isMock = false;

if (
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_ANON_KEY &&
  !process.env.SUPABASE_URL.includes('sample-project')
) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // In-Memory Storage Layer for instant offline testing and development
  isMock = true;
  const mockVehicles = [
    {
      id: 1,
      brand: 'Tesla',
      model: 'Model 3',
      year: 2024,
      category: 'Electric',
      daily_rate: 4500.0,
      fuel_type: 'EV',
      seating_capacity: 5,
      status: 'available',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      brand: 'BMW',
      model: 'X5',
      year: 2023,
      category: 'SUV',
      daily_rate: 6000.0,
      fuel_type: 'Petrol',
      seating_capacity: 7,
      status: 'available',
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      brand: 'Mercedes-Benz',
      model: 'C-Class',
      year: 2023,
      category: 'Luxury',
      daily_rate: 7500.0,
      fuel_type: 'Diesel',
      seating_capacity: 5,
      status: 'available',
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      brand: 'Honda',
      model: 'City',
      year: 2022,
      category: 'Sedan',
      daily_rate: 2200.0,
      fuel_type: 'Petrol',
      seating_capacity: 5,
      status: 'available',
      created_at: new Date().toISOString()
    },
    {
      id: 5,
      brand: 'Hyundai',
      model: 'i20',
      year: 2023,
      category: 'Hatchback',
      daily_rate: 1600.0,
      fuel_type: 'Petrol',
      seating_capacity: 5,
      status: 'available',
      created_at: new Date().toISOString()
    }
  ];

  const mockRentals = [];
  const mockUsers = [];

  supabase = {
    isMock: true,
    mockData: {
      vehicles: mockVehicles,
      rentals: mockRentals,
      users: mockUsers
    }
  };
}

module.exports = { supabase, isMock };
