# Car Rental & Fleet Booking System

A production-ready API for managing vehicle rentals, built with Node.js, Express, and Supabase.

## Features
- Supabase Authentication (Register/Login)
- Vehicle CRUD with category and status filters
- Rental Booking with date collision checks and automatic cost computation
- Route Guards and centralized Error Handling

## Setup

1. Copy `.env.example` to `.env` and fill in your Supabase details.
2. Run SQL scripts from `schema.sql` in your Supabase SQL editor.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Vehicles
- `GET /api/vehicles`
- `GET /api/vehicles/:id`
- `POST /api/vehicles` (Admin/Auth)
- `PUT /api/vehicles/:id` (Admin/Auth)
- `DELETE /api/vehicles/:id` (Admin/Auth)

### Rentals
- `POST /api/rentals` (Auth)
- `GET /api/rentals/my-bookings` (Auth)
- `PATCH /api/rentals/:id/cancel` (Auth)
- `PATCH /api/rentals/:id/complete` (Auth)
