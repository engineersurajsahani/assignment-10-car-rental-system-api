# 🚗 Assignment 10 — Car Rental & Fleet Booking System API

A REST API for managing vehicles, customer rentals, bookings, authentication, and rental availability using **Node.js, Express.js, Supabase PostgreSQL, and Supabase Authentication**.

## 🚀 Live API

https://itm-assignment-10-car-rental-api.onrender.com


## 🛠️ Technologies Used

* Node.js
* Express.js
* Supabase PostgreSQL
* Supabase Authentication
* JavaScript
* dotenv
* CORS
* REST API
* JWT Authentication

## 📁 Project Structure

```text
assignment-10-car-rental-api/
│
├── config/
│   └── supabase.js
│
├── controllers/
│   ├── authController.js
│   ├── rentalController.js
│   └── vehicleController.js
│
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
│
├── routes/
│   ├── authRoutes.js
│   ├── rentalRoutes.js
│   └── vehicleRoutes.js
│
├── .env.example
├── .gitignore
├── package.json
├── server.js
├── supabase_schema.sql
└── README.md
```

## ✨ Features

### Authentication

* User registration using Supabase Authentication
* User login using email and password
* JWT-based authentication
* Protected routes using authentication middleware

### Vehicle Management

* View all vehicles
* Filter vehicles by category and status
* View vehicle details
* Add a vehicle
* Update vehicle information
* Delete a vehicle
* Prevent deletion of vehicles with active/booked rentals

### Rental Management

* Create a vehicle booking
* Automatically calculate total rental cost
* Prevent overlapping bookings
* View user's bookings
* Cancel bookings
* Complete rentals
* Automatically make the vehicle available after completion

### Booking Collision Prevention

The API checks existing bookings before creating a new rental.

For example:

```text
Existing booking:
01 May 2026 → 05 May 2026

New booking:
03 May 2026 → 07 May 2026
```

The API rejects the second booking with:

```text
400 Bad Request
Vehicle already reserved during this timeframe
```

## 🗄️ Database

The project uses **Supabase PostgreSQL**.

### Vehicles Table

```text
id
brand
model
year
category
daily_rate
fuel_type
seating_capacity
status
created_at
```

### Rentals Table

```text
id
user_id
vehicle_id
customer_name
customer_email
start_date
end_date
total_cost
status
created_at
valid_date_range
```

The `vehicle_id` column in the rentals table is related to the `vehicles` table.

## 🔐 Environment Variables

Create a `.env` file in the project root:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_publishable_key
PORT=4000
```

Do not upload the `.env` file to GitHub.

The `.gitignore` file already contains:

```text
node_modules/
.env
.DS_Store
```

## 💻 Local Setup

### 1. Clone the repository

```bash
git clone YOUR-GITHUB-REPOSITORY-LINK
```

### 2. Open the project

```bash
cd assignment-10-car-rental-api
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file and add:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_publishable_key
PORT=4000
```

### 5. Set up Supabase

Open the Supabase SQL Editor and run the SQL commands from:

```text
supabase_schema.sql
```

This creates the required tables and sample vehicles.

### 6. Start the server

For development:

```bash
npm run dev
```

Or:

```bash
npm start
```

The API will run at:

```text
http://localhost:4000
```

## 📌 API Endpoints

### Authentication

| Method | Endpoint             | Description         |
| ------ | -------------------- | ------------------- |
| POST   | `/api/auth/register` | Register a new user |
| POST   | `/api/auth/login`    | Login user          |

### Vehicles

| Method | Endpoint            | Authentication |
| ------ | ------------------- | -------------- |
| GET    | `/api/vehicles`     | No             |
| GET    | `/api/vehicles/:id` | No             |
| POST   | `/api/vehicles`     | Required       |
| PUT    | `/api/vehicles/:id` | Required       |
| DELETE | `/api/vehicles/:id` | Required       |

### Rentals

| Method | Endpoint                    | Authentication |
| ------ | --------------------------- | -------------- |
| POST   | `/api/rentals`              | Required       |
| GET    | `/api/rentals/my-bookings`  | Required       |
| PATCH  | `/api/rentals/:id/cancel`   | Required       |
| PATCH  | `/api/rentals/:id/complete` | Required       |

## 🧪 Testing with Postman

### 1. Register

```text
POST /api/auth/register
```

Request body:

```json
{
  "name": "Mahek",
  "email": "mahek@example.com",
  "password": "password123"
}
```

### 2. Login

```text
POST /api/auth/login
```

Request body:

```json
{
  "email": "mahek@example.com",
  "password": "password123"
}
```

Copy the `access_token` from the response.

For protected routes, add:

```text
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 3. View Vehicles

```text
GET /api/vehicles
```

### 4. Create a Rental

```text
POST /api/rentals
```

Example body:

```json
{
  "vehicle_id": 1,
  "customer_name": "Mahek Yadav",
  "customer_email": "mahek@example.com",
  "start_date": "2026-05-01",
  "end_date": "2026-05-05"
}
```

### 5. Test Booking Collision

First book vehicle `1`:

```text
01 May 2026 → 05 May 2026
```

Then try booking the same vehicle:

```text
03 May 2026 → 07 May 2026
```

Expected response:

```text
400 Bad Request
Vehicle already reserved during this timeframe
```

## 🌐 Deployment

The API is deployed using **Render**.

### Render Configuration

**Build Command:**

```bash
npm install
```

**Start Command:**

```bash
npm start
```

**Environment Variables:**

```text
SUPABASE_URL
SUPABASE_ANON_KEY
PORT
```

For Render, the `PORT` value can be:

```text
10000
```

After deployment, update the live API URL
