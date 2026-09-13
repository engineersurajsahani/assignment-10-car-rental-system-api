/**
 * Automated Verification Script for Assignment 10: Car Rental & Fleet Booking System
 * Validates:
 * 1. Health & Server Info
 * 2. Supabase Auth Registration & Login
 * 3. Vehicle fleet listing & category filter
 * 4. Relational vehicle details with past rentals
 * 5. Adding new vehicle (Admin/User)
 * 6. Booking Vehicle #1 for 2026-05-01 to 2026-05-05
 * 7. DATE COLLISION PREVENTION: Attempting booking for 2026-05-03 to 2026-05-07 (Must reject 400)
 * 8. Billing calculation check: (Days * daily_rate)
 * 9. Listing user's bookings (/api/rentals/my-bookings)
 * 10. Fleet availability state transitions: available -> rented -> completed -> available
 */

const http = require('http');
const app = require('./server');

const PORT = 5099;
let server;
let authToken = '';
let registeredUserId = '';

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data && { 'Content-Length': Buffer.byteLength(data) }),
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const req = http.request(options, (res) => {
      let resBody = '';
      res.on('data', (chunk) => resBody += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(resBody);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: resBody });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (data) req.write(data);
    req.end();
  });
};

async function runTests() {
  console.log('================================================================');
  console.log('🚗 STARTING AUTOMATED TEST SUITE: CAR RENTAL API (ASSIGNMENT 10)');
  console.log('👤 Student: Prince Yadav (150096725032)');
  console.log('================================================================\n');

  server = app.listen(PORT, async () => {
    try {
      let passed = 0;
      let total = 0;

      const assertTest = (testName, condition, details = '') => {
        total++;
        if (condition) {
          console.log(`✅ [PASS] ${testName}`);
          passed++;
        } else {
          console.error(`❌ [FAIL] ${testName} ${details ? '- ' + details : ''}`);
        }
      };

      // 1. Health Check
      const health = await request('GET', '/api/health');
      assertTest('1. Server Health Check Endpoint', health.status === 200 && health.body.status === 'OK');

      // 2. Auth: Register Driver
      const uniqueEmail = `driver_${Date.now()}@travel.com`;
      const reg = await request('POST', '/api/auth/register', {
        name: 'David',
        email: uniqueEmail,
        password: 'mypassword123'
      });
      assertTest('2. Supabase Auth Registration', reg.status === 201 && reg.body.success === true);

      // 3. Auth: Login
      const login = await request('POST', '/api/auth/login', {
        email: uniqueEmail,
        password: 'mypassword123'
      });
      assertTest('3. Supabase Auth Login & Token Issuance', login.status === 200 && !!login.body.token);
      authToken = login.body.token;
      registeredUserId = login.body.user?.id;

      // 4. Vehicles: Fetch Fleet (Public)
      const fleet = await request('GET', '/api/vehicles');
      assertTest('4. Fetch Vehicles Fleet (Public)', fleet.status === 200 && Array.isArray(fleet.body.data) && fleet.body.data.length >= 3);

      // 5. Vehicles: Filter by category (SUV)
      const suvFilter = await request('GET', '/api/vehicles?category=SUV');
      assertTest('5. Filter Fleet by Category (?category=SUV)', suvFilter.status === 200 && suvFilter.body.data.every(v => v.category === 'SUV'));

      // 6. Vehicles: Add New Vehicle (Protected)
      const newCar = await request('POST', '/api/vehicles', {
        brand: 'BMW',
        model: 'i4 M50',
        year: 2024,
        category: 'Electric',
        daily_rate: 6000,
        fuel_type: 'EV',
        seating_capacity: 5
      }, authToken);
      assertTest('6. Add New Vehicle to Fleet (Auth Required)', newCar.status === 201 && newCar.body.data.brand === 'BMW');
      const testCarId = newCar.body.data?.id;

      // 7. Vehicles: Relational View with past rentals
      const relVehicle = await request('GET', `/api/vehicles/${testCarId}`);
      assertTest('7. Relational Join: Vehicle details with past rentals array', relVehicle.status === 200 && Array.isArray(relVehicle.body.data.rentals));

      // 8. Rentals: Book Vehicle #1 for 2026-05-01 to 2026-05-05 (4 days @ 4500 = 18000)
      const booking1 = await request('POST', '/api/rentals', {
        vehicle_id: 1,
        start_date: '2026-05-01',
        end_date: '2026-05-05',
        customer_name: 'David',
        customer_email: uniqueEmail
      }, authToken);
      const isBooking1Valid = booking1.status === 201 && 
                              booking1.body.billing?.days_reserved === 4 && 
                              booking1.body.billing?.total_cost === 18000;
      assertTest('8. Book Vehicle #1 with Auto Cost Billing (4 days * 4500 = 18000)', isBooking1Valid, JSON.stringify(booking1.body));
      const booking1Id = booking1.body.data?.id;

      // 9. Rentals: DATE COLLISION PREVENTION
      // Try booking Vehicle #1 again for 2026-05-03 to 2026-05-07 (Overlap during 2026-05-03 to 2026-05-05)
      const bookingCollision = await request('POST', '/api/rentals', {
        vehicle_id: 1,
        start_date: '2026-05-03',
        end_date: '2026-05-07',
        customer_name: 'Jane Doe',
        customer_email: 'jane@test.com'
      }, authToken);
      const isCollisionDetected = bookingCollision.status === 400 && 
                                  bookingCollision.body.message.includes('already reserved');
      assertTest('9. Date Collision Prevention (2026-05-03 to 2026-05-07 Rejected 400)', isCollisionDetected, bookingCollision.body.message);

      // 10. Rentals: My Bookings
      const myBookings = await request('GET', '/api/rentals/my-bookings', null, authToken);
      assertTest('10. List Authenticated User Bookings (/api/rentals/my-bookings)', myBookings.status === 200 && myBookings.body.data.length >= 1);

      // 11. Vehicle State Transition: Complete rental & mark car returned
      const completeRes = await request('PATCH', `/api/rentals/${booking1Id}/complete`, null, authToken);
      assertTest('11. Mark Vehicle Returned (/api/rentals/:id/complete)', completeRes.status === 200 && completeRes.body.data.status === 'completed');

      // 12. Verify Vehicle #1 status transitioned back to 'available'
      const vehicleCheck = await request('GET', '/api/vehicles/1');
      assertTest('12. Verify Vehicle State Transition back to "available"', vehicleCheck.status === 200 && vehicleCheck.body.data.status === 'available');

      // 13. Second booking to test cancellation
      const booking2 = await request('POST', '/api/rentals', {
        vehicle_id: 2,
        start_date: '2026-06-10',
        end_date: '2026-06-15',
        customer_name: 'David',
        customer_email: uniqueEmail
      }, authToken);
      const booking2Id = booking2.body.data?.id;

      const cancelRes = await request('PATCH', `/api/rentals/${booking2Id}/cancel`, null, authToken);
      assertTest('13. Cancel Upcoming Rental (/api/rentals/:id/cancel)', cancelRes.status === 200 && cancelRes.body.data.status === 'cancelled');

      // Summary
      console.log('\n================================================================');
      console.log(`🎯 TEST RESULTS: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
      console.log('================================================================\n');

      server.close(() => {
        process.exit(passed === total ? 0 : 1);
      });
    } catch (err) {
      console.error('Test execution error:', err);
      if (server) server.close();
      process.exit(1);
    }
  });
}

runTests();
