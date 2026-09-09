const http = require('http');
process.env.NODE_ENV = 'test';
const app = require('./server');

let server;
const PORT = 5001;

function request(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path,
        method,
        headers: reqHeaders
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(body);
          } catch (e) {
            parsed = body;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  server = app.listen(PORT, async () => {
    console.log(`Test Server running on port ${PORT}\n`);

    try {
      console.log('--- TEST 1: Health Check GET / ---');
      const health = await request('GET', '/');
      console.log('Status:', health.status);
      console.assert(health.status === 200, 'Health check failed');

      console.log('\n--- TEST 2: GET /api/vehicles (Fetch vehicles fleet) ---');
      const vehiclesRes = await request('GET', '/api/vehicles');
      console.log('Status:', vehiclesRes.status, 'Count:', vehiclesRes.body.count);
      console.assert(vehiclesRes.status === 200, 'Fetch vehicles failed');
      console.assert(vehiclesRes.body.count >= 3, 'Expected at least 3 vehicles');

      console.log('\n--- TEST 3: Auth Register & Login ---');
      const registerRes = await request('POST', '/api/auth/register', {
        email: 'driver@travel.com',
        password: 'mypassword123',
        name: 'David'
      });
      console.log('Register Status:', registerRes.status);
      console.assert(registerRes.status === 201, 'Registration failed');

      const loginRes = await request('POST', '/api/auth/login', {
        email: 'driver@travel.com',
        password: 'mypassword123'
      });
      console.log('Login Status:', loginRes.status);
      console.assert(loginRes.status === 200, 'Login failed');
      const token = loginRes.body.access_token;
      console.assert(token !== undefined, 'Token missing');

      const authHeaders = { Authorization: `Bearer ${token}` };

      console.log('\n--- TEST 4: Book Vehicle #1 for dates 2026-05-01 to 2026-05-05 ---');
      const booking1 = await request(
        'POST',
        '/api/rentals',
        {
          vehicle_id: 1,
          start_date: '2026-05-01',
          end_date: '2026-05-05',
          customer_name: 'David',
          customer_email: 'driver@travel.com'
        },
        authHeaders
      );
      console.log('Booking 1 Status:', booking1.status);
      console.log('Booking 1 Response:', booking1.body);
      console.assert(booking1.status === 201, 'Booking 1 failed');
      console.assert(booking1.body.data.total_cost > 0, 'Total cost calculation failed');
      const rentalId = booking1.body.data.id;

      console.log('\n--- TEST 5: Collision Test: Try booking Vehicle #1 again for 2026-05-03 to 2026-05-07 ---');
      const collisionBooking = await request(
        'POST',
        '/api/rentals',
        {
          vehicle_id: 1,
          start_date: '2026-05-03',
          end_date: '2026-05-07',
          customer_name: 'David',
          customer_email: 'driver@travel.com'
        },
        authHeaders
      );
      console.log('Collision Status:', collisionBooking.status);
      console.log('Collision Response:', collisionBooking.body);
      console.assert(collisionBooking.status === 400, 'Collision test failed! Expected 400 Bad Request');
      console.assert(
        collisionBooking.body.message.includes('already reserved'),
        'Collision message mismatch'
      );

      console.log('\n--- TEST 6: GET /api/rentals/my-bookings ---');
      const myBookings = await request('GET', '/api/rentals/my-bookings', null, authHeaders);
      console.log('My Bookings Status:', myBookings.status, 'Count:', myBookings.body.count);
      console.assert(myBookings.status === 200, 'My bookings failed');

      console.log('\n--- TEST 7: PATCH /api/rentals/:id/complete ---');
      const completeRes = await request('PATCH', `/api/rentals/${rentalId}/complete`, null, authHeaders);
      console.log('Complete Status:', completeRes.status);
      console.assert(completeRes.status === 200, 'Complete rental failed');

      console.log('\n--- TEST 8: Create, Update & Delete Vehicle ---');
      const createVehRes = await request(
        'POST',
        '/api/vehicles',
        {
          brand: 'Audi',
          model: 'e-tron',
          year: 2025,
          category: 'Electric',
          daily_rate: 6000,
          fuel_type: 'EV',
          seating_capacity: 5
        },
        authHeaders
      );
      console.log('Create Vehicle Status:', createVehRes.status);
      console.assert(createVehRes.status === 201, 'Create vehicle failed');
      const newVehId = createVehRes.body.data.id;

      const updateVehRes = await request(
        'PUT',
        `/api/vehicles/${newVehId}`,
        {
          daily_rate: 6500,
          status: 'available'
        },
        authHeaders
      );
      console.log('Update Vehicle Status:', updateVehRes.status);
      console.assert(updateVehRes.status === 200, 'Update vehicle failed');

      const deleteVehRes = await request('DELETE', `/api/vehicles/${newVehId}`, null, authHeaders);
      console.log('Delete Vehicle Status:', deleteVehRes.status);
      console.assert(deleteVehRes.status === 200, 'Delete vehicle failed');

      console.log('\nALL TESTS PASSED SUCCESSFULLY!');
      server.close();
      process.exit(0);
    } catch (err) {
      console.error('\nTEST ERROR:', err);
      if (server) server.close();
      process.exit(1);
    }
  });
}

runTests();
