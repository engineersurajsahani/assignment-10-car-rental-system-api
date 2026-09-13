const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') && 
  !supabaseUrl.includes('your-project-ref') && 
  !supabaseAnonKey.includes('your-anon-public-key');

let supabase;
let supabaseAdmin;

if (isConfigured) {
  console.log('⚡ Initializing live Supabase client connected to:', supabaseUrl);
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  if (supabaseServiceKey && !supabaseServiceKey.includes('your-service-role')) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  } else {
    supabaseAdmin = supabase;
  }
} else {
  console.warn('⚠️ Supabase credentials not configured or placeholder detected in .env.');
  console.warn('ℹ️ Running in Mock / Simulation Engine Mode for local testing and demonstration.');
  
  // Local In-Memory Mock Database for offline development and instant testing
  const mockVehicles = [
    {
      id: 1,
      brand: 'Tesla',
      model: 'Model 3',
      year: 2024,
      category: 'Electric',
      daily_rate: 4500.00,
      fuel_type: 'EV',
      seating_capacity: 5,
      status: 'available',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      brand: 'Hyundai',
      model: 'Creta',
      year: 2023,
      category: 'SUV',
      daily_rate: 3000.00,
      fuel_type: 'Petrol',
      seating_capacity: 5,
      status: 'available',
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      brand: 'Honda',
      model: 'City',
      year: 2022,
      category: 'Sedan',
      daily_rate: 2500.00,
      fuel_type: 'Petrol',
      seating_capacity: 5,
      status: 'available',
      created_at: new Date().toISOString()
    }
  ];

  const mockRentals = [];
  const mockUsers = [];
  let nextVehicleId = 4;
  let nextRentalId = 1;

  // Chainable query builder simulator
  class MockQueryBuilder {
    constructor(tableName) {
      this.tableName = tableName;
      this.filters = [];
      this.isSingle = false;
      this.insertData = null;
      this.updateData = null;
      this.isDelete = false;
      this.selectedColumns = '*';
    }

    select(columns = '*') {
      this.selectedColumns = columns;
      return this;
    }

    eq(column, value) {
      this.filters.push({ type: 'eq', column, value });
      return this;
    }

    in(column, values) {
      this.filters.push({ type: 'in', column, values });
      return this;
    }

    lte(column, value) {
      this.filters.push({ type: 'lte', column, value });
      return this;
    }

    gte(column, value) {
      this.filters.push({ type: 'gte', column, value });
      return this;
    }

    order(column, { ascending = true } = {}) {
      this.orderColumn = column;
      this.orderAscending = ascending;
      return this;
    }

    single() {
      this.isSingle = true;
      return this;
    }

    insert(data) {
      this.insertData = data;
      return this;
    }

    update(data) {
      this.updateData = data;
      return this;
    }

    delete() {
      this.isDelete = true;
      return this;
    }

    async then(resolve, reject) {
      try {
        let table = this.tableName === 'vehicles' ? mockVehicles : mockRentals;

        // INSERT
        if (this.insertData) {
          const toInsert = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
          const inserted = toInsert.map(item => {
            const id = this.tableName === 'vehicles' ? nextVehicleId++ : nextRentalId++;
            const record = {
              id,
              ...item,
              created_at: new Date().toISOString()
            };
            table.push(record);
            return record;
          });

          const result = this.isSingle ? inserted[0] : inserted;
          return resolve({ data: result, error: null });
        }

        // DELETE
        if (this.isDelete) {
          let deleted = [];
          for (let i = table.length - 1; i >= 0; i--) {
            const item = table[i];
            const matches = this.matchesFilters(item);
            if (matches) {
              deleted.push(table.splice(i, 1)[0]);
            }
          }
          return resolve({ data: deleted, error: null });
        }

        // UPDATE
        if (this.updateData) {
          let updated = [];
          for (const item of table) {
            if (this.matchesFilters(item)) {
              Object.assign(item, this.updateData);
              updated.push({ ...item });
            }
          }
          const result = this.isSingle ? (updated[0] || null) : updated;
          return resolve({ data: result, error: null });
        }

        // SELECT
        let results = table.filter(item => this.matchesFilters(item));

        // Relational JOIN simulation if selecting vehicles with rentals or rentals with vehicles
        if (this.tableName === 'vehicles') {
          results = results.map(v => {
            const vehicleCopy = { ...v };
            if (this.selectedColumns.includes('rentals')) {
              vehicleCopy.rentals = mockRentals.filter(r => Number(r.vehicle_id) === Number(v.id));
            }
            return vehicleCopy;
          });
        } else if (this.tableName === 'rentals') {
          results = results.map(r => {
            const rentalCopy = { ...r };
            if (this.selectedColumns.includes('vehicles')) {
              rentalCopy.vehicles = mockVehicles.find(v => Number(v.id) === Number(r.vehicle_id)) || null;
            }
            return rentalCopy;
          });
        }

        if (this.orderColumn) {
          results.sort((a, b) => {
            if (this.orderAscending) return a[this.orderColumn] > b[this.orderColumn] ? 1 : -1;
            return a[this.orderColumn] < b[this.orderColumn] ? 1 : -1;
          });
        }

        if (this.isSingle) {
          return resolve({ data: results[0] || null, error: results[0] ? null : { message: 'Row not found', code: 'PGRST116' } });
        }

        return resolve({ data: results, error: null });
      } catch (err) {
        return reject({ data: null, error: err });
      }
    }

    matchesFilters(item) {
      for (const filter of this.filters) {
        if (filter.type === 'eq') {
          if (String(item[filter.column]) !== String(filter.value)) return false;
        } else if (filter.type === 'in') {
          if (!filter.values.map(String).includes(String(item[filter.column]))) return false;
        } else if (filter.type === 'lte') {
          // Date string or number comparison
          if (item[filter.column] > filter.value) return false;
        } else if (filter.type === 'gte') {
          if (item[filter.column] < filter.value) return false;
        }
      }
      return true;
    }
  }

  // Simulated Auth Client
  const mockAuth = {
    async signUp({ email, password, options = {} }) {
      const existing = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return { data: null, error: { message: 'User already registered' } };
      }
      const userId = 'mock-user-' + Math.random().toString(36).substring(2, 9);
      const user = {
        id: userId,
        email,
        user_metadata: { name: options.data?.name || 'User' }
      };
      mockUsers.push({ ...user, password });
      const access_token = 'mock_jwt_token_' + userId;
      return {
        data: {
          user,
          session: { access_token, user }
        },
        error: null
      };
    },

    async signInWithPassword({ email, password }) {
      const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      if (!user) {
        return { data: null, error: { message: 'Invalid login credentials' } };
      }
      const access_token = 'mock_jwt_token_' + user.id;
      return {
        data: {
          user: { id: user.id, email: user.email, user_metadata: user.user_metadata },
          session: { access_token, user: { id: user.id, email: user.email, user_metadata: user.user_metadata } }
        },
        error: null
      };
    },

    async getUser(token) {
      if (!token || !token.startsWith('mock_jwt_token_')) {
        return { data: { user: null }, error: { message: 'Invalid or missing JWT token' } };
      }
      const userId = token.replace('mock_jwt_token_', '');
      const user = mockUsers.find(u => u.id === userId);
      if (!user) {
        return { data: { user: null }, error: { message: 'User session not found' } };
      }
      return {
        data: {
          user: { id: user.id, email: user.email, user_metadata: user.user_metadata }
        },
        error: null
      };
    }
  };

  supabase = {
    from: (table) => new MockQueryBuilder(table),
    auth: mockAuth
  };
  supabaseAdmin = supabase;
}

module.exports = {
  supabase,
  supabaseAdmin,
  isConfigured
};
