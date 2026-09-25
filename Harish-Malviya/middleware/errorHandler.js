/**
 * Centralized Error Handling Middleware
 * 
 * Catches unhandled errors, formats Postgres/Supabase error codes
 * into human-readable messages, and returns a standardized JSON structure.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error('[Error Details]:', {
    message: err.message,
    code: err.code,
    details: err.details,
    hint: err.hint,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Map PostgreSQL error codes to friendly HTTP status codes and messages
  if (err.code) {
    switch (err.code) {
      // 23514: Check constraint violation
      case '23514':
        statusCode = 400;
        if (err.message && err.message.includes('valid_date_range')) {
          message = 'Validation Error: Rental end_date must be greater than or equal to start_date.';
        } else if (err.message && err.message.includes('category')) {
          message = 'Validation Error: Category must be one of Sedan, SUV, Luxury, Hatchback, or Electric.';
        } else if (err.message && err.message.includes('daily_rate')) {
          message = 'Validation Error: daily_rate must be a positive number greater than 0.';
        } else if (err.message && err.message.includes('status')) {
          message = 'Validation Error: Invalid status value provided.';
        } else {
          message = `Validation Error: Database check constraint failed (${err.details || err.message}).`;
        }
        break;

      // 23505: Unique violation
      case '23505':
        statusCode = 409;
        message = `Conflict Error: A record with the specified value already exists (${err.details || err.message}).`;
        break;

      // 23503: Foreign key violation
      case '23503':
        statusCode = 400;
        if (err.details && err.details.includes('rentals') && err.details.includes('vehicles')) {
          message = 'Foreign Key Error: Cannot perform operation because related rental records exist (ON DELETE RESTRICT).';
        } else {
          message = `Foreign Key Error: Referenced record does not exist or cannot be deleted (${err.details || err.message}).`;
        }
        break;

      // 22P02: Invalid text representation (e.g. string passed for integer or uuid)
      case '22P02':
        statusCode = 400;
        message = 'Invalid data type or ID format provided in request parameters.';
        break;

      // 22008: Datetime field overflow / invalid date
      case '22008':
        statusCode = 400;
        message = 'Invalid date format provided. Please use YYYY-MM-DD format.';
        break;

      // 42P01: Undefined table
      case '42P01':
        statusCode = 500;
        message = 'Database schema error: Table does not exist. Please run sql/schema.sql in your Supabase SQL editor.';
        break;

      default:
        break;
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      code: err.code,
      details: err.details,
      stack: err.stack
    })
  });
};

module.exports = errorHandler;
