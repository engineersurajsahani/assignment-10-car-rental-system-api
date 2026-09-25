const http = require('http');
const dotenv = require('dotenv');
dotenv.config();

const app = require('./server');

const PORT = 5055;
let server;
let baseUrl = `http://localhost:${PORT}`;

let authToken = '';
let userId = '';
let vehicleId1 = null;
let vehicleId2 = null;
let vehicleId3 = null;
let rentalId1 = null;

// Helper to make fetch requests
async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (authToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
  });

  const status = response.status;
  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    data = await response.text();
  }

  return { status, data };
}

// Colors for output
const green = (t) => `\x1b[32m${t}\x1b[0m`;
const red = (t) => `\x1b[31m${t}\x1b[0m`;
const cyan = (t) => `\x1b[36m${t}\x1b[0m`;
const bold = (t) => `\x1b[1m${t}\x1b[0m`;

async function runTests() {
  console.log(bold('\n======================================================'));
  console.log(bold('  🧪 CAR RENTAL & FLEET BOOKING API - E2E TEST SUITE  '));
  console.log(bold('======================================================\n'));

  // Start temporary local server on PORT 5055
  await new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`[Test Server] Running on ${baseUrl}\n`);
      resolve();
    });
  });

  let passed = 0;
  let failed = 0;

  function assert(title, condition, extraInfo = '') {
    if (condition) {
      console.log(`  ${green('✔ PASS')}: ${title}`);
      passed++;
    } else {
      console.log(`  ${red('✖ FAIL')}: ${title}`);
      if (extraInfo) console.log(`         ${red(JSON.stringify(extraInfo))}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // 1. Health & Root Endpoints
    // -------------------------------------------------------------------------
    console.log(cyan(bold('1. System & Health Endpoints')));
    const rootRes = await request('/');
    assert('GET / returns 200 with API metadata', rootRes.status === 200 && rootRes.data.success === true);

    const healthRes = await request('/api/health');
    assert('GET /api/health returns 200 healthy status', healthRes.status === 200 && healthRes.data.status === 'healthy');

    // -------------------------------------------------------------------------
    // 2. Authentication Flow
    // -------------------------------------------------------------------------
    console.log(cyan(bold('\n2. Authentication Flow (Register & Login)')));
    const testEmail = `alex.driver.${Date.now()}@gmail.com`;
    const testPassword = 'Password123!';
    const testName = 'Alex Driver';

    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: { email: testEmail, password: testPassword, name: testName }
    });
    assert('POST /api/auth/register creates user (201 Created)', regRes.status === 201 && regRes.data.success === true, regRes.data);
    if (regRes.data?.data?.id) userId = regRes.data.data.id;

    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: testPassword }
    });
    assert('POST /api/auth/login returns JWT session tokens (200 OK)', loginRes.status === 200 && !!loginRes.data.data?.access_token, loginRes.data);
    if (loginRes.data?.data?.access_token) {
      authToken = loginRes.data.data.access_token;
    }

    // -------------------------------------------------------------------------
    // 3. Vehicles Fleet Management
    // -------------------------------------------------------------------------
    console.log(cyan(bold('\n3. Vehicles Fleet Management')));

    // Insert Vehicle #1: Tesla Model 3 (Electric)
    const v1Res = await request('/api/vehicles', {
      method: 'POST',
      body: {
        brand: 'Tesla',
        model: 'Model 3',
        year: 2024,
        category: 'Electric',
        daily_rate: 85.00,
        fuel_type: 'Electric',
        seating_capacity: 5,
        status: 'available'
      }
    });
    assert('POST /api/vehicles creates Vehicle #1 - Tesla Model 3 (201 Created)', v1Res.status === 201 && v1Res.data.success === true, v1Res.data);
    vehicleId1 = v1Res.data?.data?.id;

    // Insert Vehicle #2: Toyota RAV4 (SUV)
    const v2Res = await request('/api/vehicles', {
      method: 'POST',
      body: {
        brand: 'Toyota',
        model: 'RAV4 Hybrid',
        year: 2023,
        category: 'SUV',
        daily_rate: 65.00,
        fuel_type: 'Hybrid',
        seating_capacity: 5,
        status: 'available'
      }
    });
    assert('POST /api/vehicles creates Vehicle #2 - Toyota RAV4 (201 Created)', v2Res.status === 201 && v2Res.data.success === true, v2Res.data);
    vehicleId2 = v2Res.data?.data?.id;

    // Insert Vehicle #3: BMW 5 Series (Luxury)
    const v3Res = await request('/api/vehicles', {
      method: 'POST',
      body: {
        brand: 'BMW',
        model: '530i Luxury',
        year: 2024,
        category: 'Luxury',
        daily_rate: 120.00,
        fuel_type: 'Gasoline',
        seating_capacity: 5,
        status: 'available'
      }
    });
    assert('POST /api/vehicles creates Vehicle #3 - BMW 5 Series (201 Created)', v3Res.status === 201 && v3Res.data.success === true, v3Res.data);
    vehicleId3 = v3Res.data?.data?.id;

    // Get All Vehicles
    const listRes = await request('/api/vehicles');
    assert('GET /api/vehicles returns all vehicles (200 OK)', listRes.status === 200 && Array.isArray(listRes.data.data) && listRes.data.data.length >= 3, listRes.data);

    // Filter Vehicles (?category=SUV&status=available)
    const filterRes = await request('/api/vehicles?category=SUV&status=available');
    const allAreSUV = filterRes.data?.data?.every(v => v.category === 'SUV' && v.status === 'available');
    assert('GET /api/vehicles?category=SUV&status=available applies filters correctly (200 OK)', filterRes.status === 200 && allAreSUV, filterRes.data);

    // Get Vehicle by ID with Rental History
    const singleVRes = await request(`/api/vehicles/${vehicleId1}`);
    assert('GET /api/vehicles/:id returns vehicle with nested rentals array (200 OK)', singleVRes.status === 200 && Array.isArray(singleVRes.data?.data?.rentals), singleVRes.data);

    // Update Vehicle
    const updateVRes = await request(`/api/vehicles/${vehicleId1}`, {
      method: 'PUT',
      body: { daily_rate: 89.00 }
    });
    assert('PUT /api/vehicles/:id updates vehicle rate (200 OK)', updateVRes.status === 200 && Number(updateVRes.data?.data?.daily_rate) === 89.00, updateVRes.data);

    // -------------------------------------------------------------------------
    // 4. Rentals & Collision Detection (Spec Core Requirements)
    // -------------------------------------------------------------------------
    console.log(cyan(bold('\n4. Rentals & Collision Verification Flow')));

    const futureYear = new Date().getFullYear() + 1;
    const dateRange1Start = `${futureYear}-05-01`;
    const dateRange1End = `${futureYear}-05-05`;
    const dateOverlapStart = `${futureYear}-05-03`;
    const dateOverlapEnd = `${futureYear}-05-07`;
    const dateRange2Start = `${futureYear}-05-10`;
    const dateRange2End = `${futureYear}-05-15`;

    // Step 1: Book Vehicle #1 for Future Range 1
    const book1Res = await request('/api/rentals', {
      method: 'POST',
      body: {
        vehicle_id: vehicleId1,
        customer_name: testName,
        customer_email: testEmail,
        start_date: dateRange1Start,
        end_date: dateRange1End
      }
    });
    // 4 days * 89.00 = 356.00
    assert(`Step 1: Book Vehicle #1 for ${dateRange1Start} to ${dateRange1End} (201 Created with server-side pricing)`, 
      book1Res.status === 201 && book1Res.data.success === true && Number(book1Res.data.data?.total_cost) === 356.00, 
      book1Res.data
    );
    rentalId1 = book1Res.data?.data?.id;

    // Step 2: Collision Test: Try booking Vehicle #1 for overlapping dates
    const collisionRes = await request('/api/rentals', {
      method: 'POST',
      body: {
        vehicle_id: vehicleId1,
        customer_name: 'Collision Tester',
        customer_email: 'collision@example.com',
        start_date: dateOverlapStart,
        end_date: dateOverlapEnd
      }
    });
    assert('Step 2: Collision Check rejects overlapping booking (400 Bad Request: "Vehicle already reserved during this timeframe")',
      collisionRes.status === 400 && collisionRes.data?.message?.includes('already reserved'),
      collisionRes.data
    );

    // Step 3: Book non-overlapping future dates
    const book2Res = await request('/api/rentals', {
      method: 'POST',
      body: {
        vehicle_id: vehicleId1,
        customer_name: testName,
        customer_email: testEmail,
        start_date: dateRange2Start,
        end_date: dateRange2End
      }
    });
    // 5 days * 89.00 = 445.00
    assert(`Step 3: Book non-overlapping range ${dateRange2Start} to ${dateRange2End} succeeds (201 Created)`,
      book2Res.status === 201 && book2Res.data.success === true && Number(book2Res.data.data?.total_cost) === 445.00,
      book2Res.data
    );

    // -------------------------------------------------------------------------
    // 5. Booking Retrieval, Cancellation, Completion & Constraints
    // -------------------------------------------------------------------------
    console.log(cyan(bold('\n5. Booking Management & Constraint Validation')));

    // Get My Bookings
    const myBookingsRes = await request('/api/rentals/my-bookings');
    assert('GET /api/rentals/my-bookings returns customer bookings joined with vehicle info (200 OK)',
      myBookingsRes.status === 200 && Array.isArray(myBookingsRes.data?.data) && myBookingsRes.data?.data?.length >= 2,
      myBookingsRes.data
    );

    // Attempt to delete vehicle with active bookings
    const deleteBlockedRes = await request(`/api/vehicles/${vehicleId1}`, { method: 'DELETE' });
    assert('DELETE /api/vehicles/:id is blocked when active bookings exist (400 Bad Request)',
      deleteBlockedRes.status === 400 && deleteBlockedRes.data?.message?.includes('active bookings'),
      deleteBlockedRes.data
    );

    // Cancel Booking
    const cancelRes = await request(`/api/rentals/${rentalId1}/cancel`, { method: 'PATCH' });
    assert('PATCH /api/rentals/:id/cancel cancels future reservation (200 OK)',
      cancelRes.status === 200 && cancelRes.data?.data?.status === 'cancelled',
      cancelRes.data
    );

    // Complete Booking
    const completeRes = await request(`/api/rentals/${book2Res.data?.data?.id}/complete`, { method: 'PATCH' });
    assert('PATCH /api/rentals/:id/complete marks rental completed & restores vehicle (200 OK)',
      completeRes.status === 200 && completeRes.data?.data?.status === 'completed',
      completeRes.data
    );

    // Delete unreserved vehicle (Vehicle #3)
    const deleteV3Res = await request(`/api/vehicles/${vehicleId3}`, { method: 'DELETE' });
    assert('DELETE /api/vehicles/:id deletes unreserved vehicle (200 OK)',
      deleteV3Res.status === 200 && deleteV3Res.data.success === true,
      deleteV3Res.data
    );

  } catch (err) {
    console.error(red('\n[Test Execution Exception]:'), err);
  } finally {
    if (server) {
      server.close();
    }
    console.log(bold('\n======================================================'));
    console.log(bold(`  RESULTS: ${green(`${passed} Passed`)}, ${failed > 0 ? red(`${failed} Failed`) : `${failed} Failed`}`));
    console.log(bold('======================================================\n'));
  }
}

runTests();
