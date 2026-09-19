const request = require('supertest');
const app = require('./server');

const runTests = async () => {
  let passed = 0;
  let total = 0;

  const assert = (condition, name) => {
    total++;
    if (condition) {
      console.log(`PASS: ${name}`);
      passed++;
    } else {
      console.error(`FAIL: ${name}`);
    }
  };

  try {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'David', email: 'driver@travel.com', password: 'mypassword123' });
    assert(regRes.status === 201 && regRes.body.data.token, 'Auth - Register user');

    const token = regRes.body.data.token;

    const logRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'driver@travel.com', password: 'mypassword123' });
    assert(logRes.status === 200 && logRes.body.data.token, 'Auth - Login user');

    const getVehicles = await request(app).get('/api/vehicles');
    assert(getVehicles.status === 200 && Array.isArray(getVehicles.body.data), 'Vehicles - Get all');

    const getVehicle1 = await request(app).get('/api/vehicles/1');
    assert(getVehicle1.status === 200 && getVehicle1.body.data.id === 1, 'Vehicles - Get by ID');

    const addVehicleRes = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        brand: 'Hyundai',
        model: 'Ioniq 5',
        year: 2024,
        category: 'Electric',
        daily_rate: 4200,
        fuel_type: 'EV',
        seating_capacity: 5
      });
    assert(addVehicleRes.status === 201 && addVehicleRes.body.data.brand === 'Hyundai', 'Vehicles - Add vehicle');
    const newVehicleId = addVehicleRes.body.data.id;

    const updateRes = await request(app)
      .put(`/api/vehicles/${newVehicleId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ daily_rate: 4400, status: 'available' });
    assert(updateRes.status === 200 && updateRes.body.data.daily_rate === 4400, 'Vehicles - Update vehicle');

    const bookRes = await request(app)
      .post('/api/rentals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vehicle_id: 1,
        start_date: '2026-05-01',
        end_date: '2026-05-05',
        customer_name: 'David',
        customer_email: 'driver@travel.com'
      });
    assert(bookRes.status === 201 && bookRes.body.data.total_cost > 0, 'Rentals - Book vehicle #1');
    const bookingId = bookRes.body.data.id;

    const collisionRes = await request(app)
      .post('/api/rentals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vehicle_id: 1,
        start_date: '2026-05-03',
        end_date: '2026-05-07',
        customer_name: 'Alex',
        customer_email: 'alex@test.com'
      });
    assert(collisionRes.status === 400, 'Rentals - Collision prevention (overlapping dates)');

    const myBookings = await request(app)
      .get('/api/rentals/my-bookings')
      .set('Authorization', `Bearer ${token}`);
    assert(myBookings.status === 200 && myBookings.body.data.length > 0, 'Rentals - Get my bookings');

    const completeRes = await request(app)
      .patch(`/api/rentals/${bookingId}/complete`)
      .set('Authorization', `Bearer ${token}`);
    assert(completeRes.status === 200 && completeRes.body.data.status === 'completed', 'Rentals - Complete booking');

    const cancelRes = await request(app)
      .patch(`/api/rentals/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${token}`);
    assert(cancelRes.status === 400, 'Rentals - Prevent cancel on completed booking');

    const deleteRes = await request(app)
      .delete(`/api/vehicles/${newVehicleId}`)
      .set('Authorization', `Bearer ${token}`);
    assert(deleteRes.status === 200, 'Vehicles - Delete vehicle');

    console.log(`\nTests completed: ${passed}/${total} passed`);
    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
};

runTests();
