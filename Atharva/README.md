# 🚗 Car Rental & Fleet Booking System API

RESTful Car Rental & Fleet Management API using Node.js, Express.js, Supabase PostgreSQL, Supabase Auth, dotenv and CORS.

## 🌐 Live Deployment

https://assignment-10-car-rental-system-api-z0ho.onrender.com

## 🛠️ Tech Stack

* Node.js
* Express.js
* Supabase PostgreSQL
* Supabase Authentication
* dotenv
* CORS

## ✨ Features

* Customer registration and login
* Supabase JWT authentication
* Vehicle fleet management
* Add, update and delete vehicles
* Vehicle category and availability filtering
* Rental booking system
* Date-range collision prevention
* Automatic rental cost calculation
* Customer booking history
* Cancel upcoming rentals
* Complete rentals and update vehicle availability
* PostgreSQL foreign key relationships
* Centralized error handling

## 👥 Authentication

Protected routes use the Supabase Bearer token.

| Role     | Access                                                               |
| -------- | -------------------------------------------------------------------- |
| Customer | View vehicles, book vehicles, view bookings, cancel/complete rentals |
| Admin    | Add, update and delete vehicles                                      |

## 📌 Main API Routes

### Authentication

| Method | Route                |
| ------ | -------------------- |
| POST   | `/api/auth/register` |
| POST   | `/api/auth/login`    |

### Vehicles

| Method | Route               |
| ------ | ------------------- |
| GET    | `/api/vehicles`     |
| GET    | `/api/vehicles/:id` |
| POST   | `/api/vehicles`     |
| PUT    | `/api/vehicles/:id` |
| DELETE | `/api/vehicles/:id` |

### Rentals

| Method | Route                       |
| ------ | --------------------------- |
| POST   | `/api/rentals`              |
| GET    | `/api/rentals/my-bookings`  |
| PATCH  | `/api/rentals/:id/cancel`   |
| PATCH  | `/api/rentals/:id/complete` |

## 🗄️ Database

Supabase PostgreSQL with:

* `vehicles` table
* `rentals` table
* Foreign key relationship between rentals and vehicles
* Rental date validation
* Vehicle status management

## 💰 Rental Calculation

Rental cost is calculated automatically based on:

`Number of rental days × Daily rate`

The API also checks overlapping rental dates to prevent double-booking.

## 📁 Project Structure

```text
assignment-10-car-rental-api/
├── config/
├── controllers/
├── middleware/
├── routes/
├── .env
├── .gitignore
├── package.json
├── server.js
└── README.md
```

## 🧪 Testing

* Register and login a customer
* Add vehicles to the fleet
* Create a rental booking
* Test overlapping dates for the same vehicle
* Check automatic rental cost calculation
* Cancel an upcoming booking
* Complete a rental and verify vehicle availability

---

### Assignment 10 – Car Rental & Fleet Booking System with Supabase
