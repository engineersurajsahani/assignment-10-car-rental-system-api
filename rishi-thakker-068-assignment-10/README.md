# 🚗 Assignment 10: Car Rental & Fleet Booking System with Supabase

**Name:** Rishi Thakker
**Roll No:** 150096725068
**Cohort:** Sam Altman

**Deployed Link:** https://assignment-10-car-rental-system-api-rren.onrender.com/

Backend for a Car Rental & Vehicle Fleet Management system built with **Node.js, Express, and Supabase (PostgreSQL + Auth)**. Prevents double-booking with date-range collision checks and calculates rental cost automatically from day span × daily rate.

## Features
- Supabase Auth registration/login (JWT access tokens issued by Supabase, not custom JWT)
- Vehicle fleet CRUD with category/status filtering
- Date-range collision prevention — a vehicle can't be booked over an overlapping range
- Automatic `total_cost = days * daily_rate` calculation on booking
- Vehicle status transitions: `available` → `rented` → `available` on cancel/complete

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register. Body: `email, password, name` |
| POST | `/api/auth/login` | Public | Login, returns Supabase `access_token` |

### Vehicles
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/vehicles` | — | List vehicles. Query: `?category=&status=` |
| GET | `/api/vehicles/:id` | — | Vehicle details + rental history |
| POST | `/api/vehicles` | Token | Add a vehicle to the fleet |
| PUT | `/api/vehicles/:id` | Token | Update rate or status |
| DELETE | `/api/vehicles/:id` | Token | Delete (blocked if it has active bookings) |

### Rentals
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/rentals` | Token | Book a vehicle. Body: `vehicle_id, start_date, end_date, customer_name, customer_email` |
| GET | `/api/rentals/my-bookings` | Token | List the logged-in user's rentals |
| PATCH | `/api/rentals/:id/cancel` | Token | Cancel an upcoming rental |
| PATCH | `/api/rentals/:id/complete` | Token | Mark returned, frees the vehicle |

## Testing Checklist (from assignment spec)
1. Run `schema.sql` and insert 3 vehicles into the `vehicles` table.
2. Book Vehicle #1 for `2026-05-01` → `2026-05-05`.
3. Try booking Vehicle #1 again for `2026-05-03` → `2026-05-07` → expect `400 Bad Request: Vehicle already reserved during this timeframe`.
4. Complete or cancel a rental and confirm the vehicle's `status` returns to `available`.

## Folder Structure
```text
rishi-thakker-068-assignment-10/
├── config/
│   └── supabase.js
├── middleware/
│   ├── auth.js
│   ├── errorHandler.js
│   └── requestLogger.js
├── router/
│   └── router.js
├── package.json
├── schema.sql
├── server.js
└── README.md
```
