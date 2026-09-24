# Car Rental & Fleet Booking API

This is the solution for Assignment 10: Car Rental & Fleet Booking System using Supabase.

## Setup Instructions

1. **Database Setup**
   Log into your Supabase project. Open the SQL Editor and execute the contents of `supabase_schema.sql` to create the `vehicles` and `rentals` tables.

2. **Environment Variables**
   Copy `.env.example` to `.env` and fill in your `SUPABASE_URL` and `SUPABASE_ANON_KEY` from your Supabase project API settings.
   ```bash
   cp .env.example .env
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Start the Application**
   ```bash
   npm run dev
   ```

## API Highlights
- Uses **Supabase Auth** for registration, login, and bearer token protection on sensitive routes.
- Includes complex **date overlap SQL logic** executed via Supabase Javascript Client `or()` syntax to prevent double booking.
- Calculates automated billing for a given `start_date` and `end_date` using native JavaScript date logic, multiplying the days by the `daily_rate`.
