# Car Rental & Fleet Booking System API

A RESTful API for managing vehicle fleet and rental bookings built with Node.js, Express.js, and Supabase.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL Cloud)
- **Authentication**: Supabase Auth
- **Other**: dotenv, cors

## Features

- ✅ Vehicle fleet management (CRUD operations)
- ✅ Date-range collision checks for bookings
- ✅ Dynamic billing calculations (daily, weekly, bi-weekly discounts)
- ✅ Supabase Auth integration
- ✅ User-specific booking management
- ✅ Vehicle status tracking (available/rented/maintenance)

## Setup

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3000
```

### 3. Setup Supabase Database

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `database/schema.sql`
3. This will create tables, indexes, and RLS policies

### 4. Run the Server

```bash
npm start
```

## Database Schema

### Vehicles Table

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Auto-increment ID |
| brand | VARCHAR(100) | Vehicle brand |
| model | VARCHAR(100) | Vehicle model |
| year | INTEGER | Manufacturing year |
| category | VARCHAR(50) | sedan/suv/hatchback/luxury/sports/van/pickup |
| daily_rate | DECIMAL(10,2) | Daily rental price |
| fuel_type | VARCHAR(50) | petrol/diesel/electric/hybrid/cng |
| seating_capacity | INTEGER | Number of seats |
| status | VARCHAR(20) | available/rented/maintenance |
| created_at | TIMESTAMP | Creation timestamp |

### Rentals Table

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Auto-increment ID |
| user_id | UUID | Supabase user ID |
| vehicle_id | INTEGER FK | Reference to vehicle |
| customer_name | VARCHAR(100) | Customer name |
| customer_email | VARCHAR(255) | Customer email |
| start_date | DATE | Rental start date |
| end_date | DATE | Rental end date |
| total_cost | DECIMAL(10,2) | Total rental cost |
| status | VARCHAR(20) | booked/active/completed/cancelled |
| created_at | TIMESTAMP | Creation timestamp |

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/logout` | Logout user | Yes |

### Vehicles

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/vehicles` | List all vehicles (filterable) | No |
| GET | `/api/vehicles/:id` | Get vehicle with past rentals | No |
| POST | `/api/vehicles` | Add new vehicle | Yes |
| PUT | `/api/vehicles/:id` | Update vehicle | Yes |
| DELETE | `/api/vehicles/:id` | Delete vehicle | Yes |

### Rentals

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/rentals` | Book a vehicle | Yes |
| GET | `/api/rentals/my-bookings` | Get user's bookings | Yes |
| PATCH | `/api/rentals/:id/cancel` | Cancel booking | Yes |
| PATCH | `/api/rentals/:id/complete` | Mark as returned | Yes |

## Dynamic Billing

The system automatically calculates rental costs:

- **Daily Rate**: Base price × number of days
- **7-13 days**: 10% weekly discount
- **14+ days**: 20% bi-weekly discount

Example:
```json
{
  "billing": {
    "dailyRate": 50.00,
    "numberOfDays": 7,
    "subtotal": 350.00,
    "discount": 35.00,
    "discountReason": "10% weekly discount applied",
    "totalCost": 315.00
  }
}
```

## Usage Examples

### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "fullName": "John Doe"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Get Vehicles (with filters)

```bash
curl http://localhost:3000/api/vehicles?category=sedan&status=available
```

### Book a Rental

```bash
curl -X POST http://localhost:3000/api/rentals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "vehicle_id": 1,
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "start_date": "2024-02-01",
    "end_date": "2024-02-07"
  }'
```

## Project Structure

```
Assignment 10 - Car Rental System API/
├── config/
│   └── supabase.js
├── controllers/
│   ├── authController.js
│   ├── rentalController.js
│   └── vehicleController.js
├── database/
│   └── schema.sql
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
├── routes/
│   ├── authRoutes.js
│   ├── rentalRoutes.js
│   └── vehicleRoutes.js
├── .env.example
├── package.json
├── server.js
└── README.md
```

## License

MIT
