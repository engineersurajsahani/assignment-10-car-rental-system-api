# 🚗 Assignment 10 — Car Rental & Fleet Booking System API

Backend assignment using **Node.js, Express.js and Supabase PostgreSQL/Auth**.

**Live Deployed Render Link:**
https://car-rental-system-api-70g3.onrender.com/

## Features

- Supabase email/password registration and login
- Bearer-token authentication middleware
- Vehicle fleet CRUD
- Vehicle category/status filtering
- Vehicle details with rental history
- Date-range collision prevention
- Automatic inclusive day-count calculation
- Automatic `days × daily_rate` billing
- User-specific booking history
- Rental cancellation
- Rental completion and vehicle status reset
- Centralized error handling
- Postman collection for testing

## 1. Install

```bash
npm install
```

## 2. Configure Supabase

Create a Supabase project and copy the project URL and anon key.

Create `.env` from `.env.example`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
PORT=4000
```

## 3. Database

Open the Supabase SQL Editor and run:

```text
sql/schema.sql
```

The script creates `vehicles` and `rentals` tables and inserts three sample vehicles.

> The `rentals.user_id` column is intended to contain the Supabase Auth user's UUID.

## 4. Start

```bash
npm start
```

Development mode:

```bash
npm run dev
```

Server:

```text
http://localhost:4000
```

## 5. API Endpoints

### Auth

| Method | Endpoint | Auth |
|---|---|---|
| POST | `/api/auth/register` | No |
| POST | `/api/auth/login` | No |

### Vehicles

| Method | Endpoint | Auth |
|---|---|---|
| GET | `/api/vehicles` | No |
| GET | `/api/vehicles/:id` | No |
| POST | `/api/vehicles` | Yes |
| PUT | `/api/vehicles/:id` | Yes |
| DELETE | `/api/vehicles/:id` | Yes |

### Rentals

| Method | Endpoint | Auth |
|---|---|---|
| POST | `/api/rentals` | Yes |
| GET | `/api/rentals/my-bookings` | Yes |
| PATCH | `/api/rentals/:id/cancel` | Yes |
| PATCH | `/api/rentals/:id/complete` | Yes |

## 6. Date Collision Logic

A requested booking overlaps an existing active/booked booking when:

```text
existing.start_date <= requested.end_date
AND
existing.end_date >= requested.start_date
```

For example:

- Vehicle #1: `2026-05-01` → `2026-05-05`
- Second request: `2026-05-03` → `2026-05-07`

The second request is rejected with HTTP `400` because the date ranges overlap.

## 7. Billing

The API uses inclusive day counting:

```text
days = (end_date - start_date) + 1
total_cost = days × daily_rate
```

Example:

```text
2026-05-01 → 2026-05-05 = 5 days
daily_rate = ₹2500
total_cost = ₹12500
```

## 8. Postman

Import:

```text
postman/Car-Rental-API.postman_collection.json
```

Recommended testing order:

1. Register
2. Login
3. Copy `access_token` into the collection `token` variable
4. Get all vehicles
5. Book Vehicle #1 for `2026-05-01` to `2026-05-05`
6. Run Conflict Test for `2026-05-03` to `2026-05-07`
7. Check My Bookings
8. Test cancel/complete on a valid booking

## 9. Project Structure

```text
JUI_TAWDE/
├── config/
│   └── supabase.js
├── controllers/
│   ├── authController.js
│   ├── rentalController.js
│   └── vehicleController.js
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
├── routes/
│   ├── authRoutes.js
│   ├── rentalRoutes.js
│   └── vehicleRoutes.js
├── sql/
│   └── schema.sql
├── postman/
│   └── Car-Rental-API.postman_collection.json
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```
