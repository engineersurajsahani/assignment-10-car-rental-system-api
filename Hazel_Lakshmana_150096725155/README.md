# Car Rental & Fleet Booking API

Node.js + Express.js + Supabase backend assignment.

## Live Link 
**https://itm-assignment-10-car-rental-api.onrender.com/**

## Local setup

```bash
npm install
cp .env.example .env
```

Fill `.env` with your Supabase project URL and anon key, then:

```bash
npm run dev
```

or

```bash
npm start
```

Default local URL: `http://localhost:4000`

## Endpoints

POST `/api/auth/register`
POST `/api/auth/login`
GET `/api/vehicles`
GET `/api/vehicles/:id`
POST `/api/vehicles`
PUT `/api/vehicles/:id`
DELETE `/api/vehicles/:id`
POST `/api/rentals`
GET `/api/rentals/my-bookings`
PATCH `/api/rentals/:id/cancel`
PATCH `/api/rentals/:id/complete`

Protected endpoints require `Authorization: Bearer YOUR_ACCESS_TOKEN`.

Run `supabase_schema.sql` in Supabase SQL Editor before testing.

## Render

Build command: `npm install`
Start command: `npm start`

Environment variables:
`SUPABASE_URL`
`SUPABASE_ANON_KEY`
`PORT=10000`
