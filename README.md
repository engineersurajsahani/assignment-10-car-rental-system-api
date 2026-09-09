# Assignment 10 – Car Rental & Fleet Booking System API

**Technology:** Node.js, Express.js, Supabase PostgreSQL, Supabase Authentication, Thunder client

## Project Overview

This project implements a backend REST API for a Car Rental and Fleet Booking System.

The API allows users to:

- Register and log in using Supabase Authentication
- View available vehicles
- View individual vehicle details
- Add new vehicles
- Update vehicle information
- Delete vehicles
- Create vehicle rentals
- Calculate rental duration and total cost
- Prevent overlapping vehicle bookings
- View the logged-in user's bookings
- Cancel future bookings
- Mark bookings as completed

## Technologies Used

- Node.js
- Express.js
- Supabase
- PostgreSQL
- Supabase Authentication
- JavaScript
- dotenv
- cors
- Thunder Client for API testing

## Project Structure
<pre>
Pallavi_sarovar_samAltman10/
└── assignment-10-car-rental-api/
    ├── config/
    │   └── supabase.js
    ├── controllers/
    │   ├── authController.js
    │   ├── rentalController.js
    │   └── vehicleController.js
    ├── middleware/
    │   ├── auth.js
    │   └── errorHandler.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── rentalRoutes.js
    │   └── vehicleRoutes.js
    ├── supabase/
    │   └── schema.sql
    ├── .env.example
    ├── .gitignore
    ├── package.json
    ├── package-lock.json
    ├── README.md
    └── server.js
</pre>

## Database

The Supabase PostgreSQL database contains two main tables: `vehicles` and `rentals`.

### Vehicles Table

The vehicles table stores:

- Vehicle ID
- Brand
- Model
- Year
- Category
- Daily rental rate
- Fuel type
- Seating capacity
- Vehicle status
- Creation timestamp

### Rentals Table

The rentals table stores:

- Rental ID
- User ID
- Vehicle ID
- Customer name
- Customer email
- Start date
- End date
- Total cost
- Rental status
- Creation timestamp

Foreign key relationships are used between rentals, users, and vehicles.

## Authentication

Supabase Authentication is used for user registration and login.

Protected endpoints require a valid Bearer access token in the Authorization header.

### Authentication Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`

## Vehicle Endpoints

### Get All Vehicles

`GET /api/vehicles`

Returns all vehicles stored in the database.

### Get Vehicle by ID

`GET /api/vehicles/:id`

Returns details of a specific vehicle along with its rental information.

### Add Vehicle

`POST /api/vehicles`

Requires authentication.

### Update Vehicle

`PUT /api/vehicles/:id`

Requires authentication.

### Delete Vehicle

`DELETE /api/vehicles/:id`

Requires authentication.

## Rental Endpoints

### Create Rental

`POST /api/rentals`

Requires authentication.

The API:

1. Checks that the vehicle exists.
2. Checks for an overlapping booking.
3. Calculates the number of rental days.
4. Calculates the total rental cost.
5. Creates the rental if the vehicle is available.

The rental duration uses an inclusive day calculation.

For example:

- Start date: `2026-05-01`
- End date: `2026-05-05`
- Rental days: `5`
- Daily rate: `₹3000`
- Total cost: `₹15000`

### Get My Bookings

`GET /api/rentals/my-bookings`

Requires authentication.

Returns the bookings belonging to the currently authenticated user.

### Cancel Rental

`PATCH /api/rentals/:id/cancel`

Requires authentication.

A future booking with status `booked` can be cancelled.

### Complete Rental

`PATCH /api/rentals/:id/complete`

Requires authentication.

Updates the rental status to `completed`.

## Date Collision Validation

The API prevents a vehicle from being booked when another active or booked rental overlaps with the requested dates.

### Successful Booking

Vehicle ID: `1`

Start date: `2026-05-01`  
End date: `2026-05-05`

The booking was successfully created with:

- Rental days: `5`
- Daily rate: `₹3000`
- Total cost: `₹15000`

### Overlapping Booking Attempt

A second booking was attempted for the same vehicle:

Start date: `2026-05-03`  
End date: `2026-05-07`

The API rejected the request with:

`400 Bad Request`

`Vehicle already reserved during this timeframe`

This confirms that overlapping vehicle reservations are prevented.

## API Testing Screenshots

The API was tested using Thunder Client.

### 1. Get All Vehicles

The `GET /api/vehicles` endpoint successfully returned the vehicles stored in the Supabase database.

<img width="1114" height="761" alt="Screenshot 2026-09-09 at 18 17 45" src="https://github.com/user-attachments/assets/fe4ef59e-d145-4d25-8807-06f6e6f3119b" />

### 2. User Login

The `POST /api/auth/login` endpoint successfully authenticated the user and returned a successful login response.

<img width="884" height="561" alt="Screenshot 2026-09-09 at 18 23 37" src="https://github.com/user-attachments/assets/c90a8bd1-f881-4bdc-814a-151c3e5459f7" />

### 3. Create Rental

A rental was successfully created for Vehicle ID 1 from `2026-05-01` to `2026-05-05`.

The API calculated:

- Rental days: `5`
- Daily rate: `₹3000`
- Total cost: `₹15000`

<img width="889" height="515" alt="Screenshot 2026-09-09 at 18 27 08" src="https://github.com/user-attachments/assets/e346c43d-3563-4b7b-ae56-14e8c785ceae" />

### 4. Date Collision Validation

A second overlapping booking attempt was rejected with a `400 Bad Request` response and the message:

`Vehicle already reserved during this timeframe`

<img width="866" height="658" alt="Screenshot 2026-09-09 at 18 28 47" src="https://github.com/user-attachments/assets/21e2a36a-da43-4bb8-b547-06e184dcc946" />

### 5. My Bookings

The `GET /api/rentals/my-bookings` endpoint successfully returned the authenticated user's rental information.

<img width="905" height="726" alt="Screenshot 2026-09-09 at 18 29 11" src="https://github.com/user-attachments/assets/ba788572-a978-4a1e-9c36-400c6c88a95c" />

### 6. Cancel Rental

A future rental was successfully cancelled using the `PATCH /api/rentals/:id/cancel` endpoint.

The response status was `200 OK` and the rental status changed to `cancelled`.

<img width="892" height="616" alt="Screenshot 2026-09-09 at 18 33 32" src="https://github.com/user-attachments/assets/9676783c-4128-4639-ae60-182f735ee072" />

### 7. Complete Rental

A rental was successfully marked as completed using the `PATCH /api/rentals/:id/complete` endpoint.

The response status was `200 OK` and the rental status changed to `completed`.

<img width="872" height="597" alt="Screenshot 2026-09-09 at 18 34 35" src="https://github.com/user-attachments/assets/acaaf34b-93fb-4540-8a6b-4b9907eb3a92" />

### 8. Add Vehicle

A new vehicle was successfully created using `POST /api/vehicles`.

The API returned `201 Created`.

<img width="887" height="705" alt="Screenshot 2026-09-09 at 18 35 08" src="https://github.com/user-attachments/assets/1a778a61-3432-4a14-84ef-4414ffacee0f" />

### 9. Update Vehicle

The vehicle information was successfully updated using `PUT /api/vehicles/:id`.

The API returned `200 OK`.

<img width="887" height="648" alt="Screenshot 2026-09-09 at 18 35 33" src="https://github.com/user-attachments/assets/77daf6c6-e343-4e61-8971-2f68ab338b9b" />

### 10. Delete Vehicle

The newly created vehicle was successfully deleted using `DELETE /api/vehicles/:id`.

The API returned `200 OK` with the message:

`Vehicle deleted successfully`

<img width="855" height="537" alt="Screenshot 2026-09-09 at 18 35 56" src="https://github.com/user-attachments/assets/fda5c429-d80f-47c9-bd15-eb5a7df7c2a4" />

## Environment Variables

Create a `.env` file locally using `.env.example` as a template.

Required variables:

    SUPABASE_URL=your_supabase_url
    SUPABASE_ANON_KEY=your_supabase_key
    PORT=3000

The `.env` file is excluded from Git using `.gitignore` and should never be uploaded to GitHub.

## Installation and Setup

Clone the repository and navigate to the project directory.

Install dependencies:

    npm install

Create the `.env` file and add the Supabase project credentials.

Run the development server:

    npm run dev

The API will run at:

    http://localhost:3000

## Conclusion

The Car Rental and Fleet Booking System API successfully implements authentication, vehicle management, rental booking, rental cost calculation, date collision prevention, booking management, cancellation, and completion functionality using Node.js, Express.js, and Supabase.
