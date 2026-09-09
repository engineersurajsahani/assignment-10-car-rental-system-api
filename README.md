# Assignment 10 - Car Rental & Fleet Booking System

## Overview

A production-ready Car Rental and Vehicle Fleet Management REST API built using Node.js, Express.js, Supabase PostgreSQL and Supabase Authentication.

The API manages vehicles, customer rentals, booking dates, rental costs and vehicle availability.

## Features

- Supabase Authentication
- Customer registration and login
- JWT-based authentication
- Vehicle fleet management
- Vehicle filtering by category and status
- Vehicle details
- Vehicle creation, update and deletion
- Rental booking management
- Date-range collision prevention
- Automatic rental cost calculation
- Rental cancellation
- Rental completion
- Vehicle availability management
- PostgreSQL foreign key constraints
- Input validation
- Authentication middleware
- Centralized error handling
- Environment variable configuration
- Postman API testing

## Tech Stack

- Node.js
- Express.js
- Supabase
- PostgreSQL
- Supabase Authentication
- dotenv
- cors

## Database

The application uses Supabase PostgreSQL with two main tables:

- vehicles
- rentals

The rentals table uses a foreign key relationship with the vehicles table.

## Authentication

Authentication is handled using Supabase Authentication.

Protected routes require a valid Bearer access token.

## API Endpoints

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
