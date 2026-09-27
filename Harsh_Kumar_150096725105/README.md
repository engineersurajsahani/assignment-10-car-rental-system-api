# 🚗 Car Rental & Fleet Booking System API

A production-ready Car Rental & Vehicle Fleet Management API utilizing Supabase (PostgreSQL & Auth).

## 👨‍🎓 Student Details

**Name:** Harsh Kumar  
**Roll No.:** 150096725105  
**Course:** BTech CSE  
**Assignment:** 10 — Car Rental & Fleet Booking System with Supabase  

## ✨ Features

- **Fleet Management:** Complete CRUD operations for vehicles, including categorisation, daily rates, and status.
- **Booking Engine:** Implements complex date-range overlap validations to prevent vehicle double-booking.
- **Dynamic Billing:** Automatic rental price calculations based on day spans (`days * daily_rate`).
- **Authentication:** Secure user authentication and authorization using Supabase Auth (JWT tokens).
- **Data Integrity:** Relational PostgreSQL schemas in Supabase with foreign keys, constraints, and timestamps.

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database & Auth:** Supabase (PostgreSQL Cloud DB & Auth)
- **Utilities:** dotenv, cors, @supabase/supabase-js

## 📁 Project Structure

```text
Harsh-Assignment-10-Car-Rental-System-Api/
├── config/
│   └── supabase.js           # Supabase client connection
├── controllers/
│   ├── authController.js     # Supabase Auth logic
│   ├── rentalController.js   # Booking calculation & collision prevention
│   └── vehicleController.js  # Vehicle CRUD & fleet filters
├── middleware/
│   ├── auth.js               # Verify Supabase Bearer token
│   └── errorHandler.js       # Centralized error handler
├── routes/
│   ├── authRoutes.js
│   ├── rentalRoutes.js
│   └── vehicleRoutes.js
├── .env.example
├── .gitignore
├── package.json
└── server.js
```

## 🚀 Getting Started

### Prerequisites

- Node.js installed
- A Supabase project set up with the provided SQL schema

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/harsh4421/Harsh-Assignment-10-Car-Rental-System-Api.git
   ```

2. Navigate to the project directory:
   ```bash
   cd Harsh-Assignment-10-Car-Rental-System-Api
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file based on `.env.example`:
   ```env
   PORT=3000
   SUPABASE_URL=https://your-supabase-project.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Start the server:
   ```bash
   npm start
   ```

   For development with nodemon:
   ```bash
   npm run dev
   ```

## 📋 API Endpoints

### 🔐 Supabase Auth Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register customer with Supabase |
| `POST` | `/api/auth/login` | Login and receive Supabase access token |

### 🚗 Vehicle Fleet Management

| Method | Endpoint | Auth Required | Description |
|---|---|:---:|---|
| `GET` | `/api/vehicles` | No | Fetch all vehicles |
| `GET` | `/api/vehicles/:id` | No | Get vehicle details with past rental records |
| `POST` | `/api/vehicles` | **Yes** | Add new vehicle to fleet |
| `PUT` | `/api/vehicles/:id` | **Yes** | Update vehicle daily rate or status |
| `DELETE` | `/api/vehicles/:id` | **Yes** | Delete vehicle from fleet |

### 📅 Rental & Booking Operations

| Method | Endpoint | Auth Required | Description |
|---|---|:---:|---|
| `POST` | `/api/rentals` | **Yes** | Book a vehicle |
| `GET` | `/api/rentals/my-bookings` | **Yes** | List rentals for authenticated user |
| `PATCH` | `/api/rentals/:id/cancel` | **Yes** | Cancel upcoming rental |
| `PATCH` | `/api/rentals/:id/complete`| **Yes** | Mark car as returned |
