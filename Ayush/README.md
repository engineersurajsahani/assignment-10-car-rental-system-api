# 🚗 Car Rental & Fleet Booking System API

Backend API for a car rental / vehicle fleet management platform, built with
**Node.js, Express, and Supabase** (PostgreSQL + Auth), implementing:

- Relational schema with foreign keys, checks, and timestamps
- **Date-range overlap / collision detection** to prevent double-booking
- **Automatic billing**: `total_cost = days_between(start,end) * daily_rate`
- Fleet status transitions: `available → rented → maintenance → available`
- Supabase JWT-based authentication and protected routes

## 1. Setup

```bash
npm install
cp .env.example .env
# then fill in SUPABASE_URL and SUPABASE_ANON_KEY from your Supabase project
```

In the **Supabase SQL Editor**, run `supabase_schema.sql` to create the
`vehicles` and `rentals` tables (plus indexes and RLS policies).

Run the server:

```bash
npm run dev     # nodemon, auto-restart
npm start        # plain node
```

Server boots on `http://localhost:5000` (or `PORT` from `.env`).

## 2. Folder Structure

```
config/supabase.js          # Supabase client (anon + per-request token client)
controllers/
  authController.js         # register / login via Supabase Auth
  vehicleController.js      # vehicle CRUD & fleet filters
  rentalController.js       # booking, collision check, billing, cancel/complete
middleware/
  auth.js                   # verifies Supabase bearer token -> req.user
  errorHandler.js           # centralized error + 404 handler
routes/
  authRoutes.js
  vehicleRoutes.js
  rentalRoutes.js
server.js                   # app entry point
supabase_schema.sql         # DB migration script
```

## 3. API Reference

### Auth

| Method | Endpoint | Auth | Body |
|---|---|---|---|
| POST | `/api/auth/register` | No | `{ email, password, name }` |
| POST | `/api/auth/login` | No | `{ email, password }` → returns `access_token` |

Use the returned `access_token` as `Authorization: Bearer <token>` on
protected routes below.

### Vehicles

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET | `/api/vehicles` | No | Filters: `?category=SUV&status=available` |
| GET | `/api/vehicles/:id` | No | Includes `rental_history` |
| POST | `/api/vehicles` | Yes | Add vehicle to fleet |
| PUT | `/api/vehicles/:id` | Yes | Update rate/status/etc. |
| DELETE | `/api/vehicles/:id` | Yes | Blocked (`400`) if active bookings exist |

### Rentals

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | `/api/rentals` | Yes | Checks overlap, computes `total_cost` |
| GET | `/api/rentals/my-bookings` | Yes | Current user's rentals |
| PATCH | `/api/rentals/:id/cancel` | Yes | Only upcoming, `status=booked` rentals |
| PATCH | `/api/rentals/:id/complete` | Yes | Sets vehicle back to `available` |

## 4. Collision Detection Logic

Two date ranges `[startA, endA]` and `[startB, endB]` overlap when:

```
startA <= endB  AND  endA >= startB
```

`rentalController.createRental` runs this as a Supabase query filtering
existing `booked`/`active` rentals for the same vehicle, and rejects the
request with `400 Bad Request: Vehicle already reserved during this
timeframe` on any match — matching the test case in the assignment (booking
`2026-05-01→05-05`, then attempting `2026-05-03→05-07`).

## 5. Testing Walkthrough

1. Run `supabase_schema.sql` in Supabase.
2. Register + login a user via `/api/auth/register` and `/api/auth/login`.
3. Insert 3 vehicles via `POST /api/vehicles` (with the bearer token).
4. `POST /api/rentals` for vehicle `#1`, `2026-05-01` → `2026-05-05`.
5. Repeat for `2026-05-03` → `2026-05-07` on the same vehicle → expect `400`.
6. `PATCH /api/rentals/:id/complete` → vehicle flips back to `available`.

## 6. Notes / Assumptions

- "Admin" write routes for vehicles currently require any authenticated
  user (per the spec's simple `Auth Required: Yes` flag). To restrict to a
  real admin role, add a `role` claim/table and check it in `middleware/auth.js`.
- Billing uses whole calendar days between `start_date` and `end_date`
  (minimum 1 day).
