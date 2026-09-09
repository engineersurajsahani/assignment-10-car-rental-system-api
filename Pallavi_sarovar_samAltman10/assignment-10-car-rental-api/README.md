# Assignment 10 - Car Rental & Fleet Booking System API

Backend API built with Node.js, Express.js, and Supabase.

## Setup

1. Install Node.js.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Add your Supabase URL and key to `.env`.
5. Run `supabase/schema.sql` in the Supabase SQL Editor.
6. Start the server with `npm run dev` or `npm start`.

## API Endpoints

### Authentication
- POST `/api/auth/register`
- POST `/api/auth/login`

### Vehicles
- GET `/api/vehicles`
- GET `/api/vehicles/:id`
- POST `/api/vehicles`
- PUT `/api/vehicles/:id`
- DELETE `/api/vehicles/:id`

### Rentals
- POST `/api/rentals`
- GET `/api/rentals/my-bookings`
- PATCH `/api/rentals/:id/cancel`
- PATCH `/api/rentals/:id/complete`

Protected endpoints require:
`Authorization: Bearer <SUPABASE_ACCESS_TOKEN>`

## Booking Logic

The API checks overlapping rental dates before creating a booking and calculates the total cost from:

`days * daily_rate`

The assignment specifies testing an initial booking from 2026-05-01 to 2026-05-05 and then rejecting an overlapping booking from 2026-05-03 to 2026-05-07.

## Note

The assignment specifies admin-protected vehicle creation/update/delete routes, but does not define a separate admin role schema. The included implementation therefore uses authenticated route protection for these routes; add role-based authorization if your instructor requires it.
