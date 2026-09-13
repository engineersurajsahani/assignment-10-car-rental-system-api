/**
 * Centralized Error Handling Middleware for Express & Supabase
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', err);
  }

  // Supabase / PostgreSQL specific error codes
  // 23505: unique_violation
  if (err.code === '23505') {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry: A record with this unique value already exists.',
      details: err.details || err.message
    });
  }

  // 23503: foreign_key_violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced foreign record does not exist or cannot be modified.',
      details: err.details || err.message
    });
  }

  // 23514: check_violation
  if (err.code === '23514') {
    return res.status(400).json({
      success: false,
      message: 'Database check constraint failed (e.g. invalid date range or status).',
      details: err.details || err.message
    });
  }

  // General fallback
  const statusCode = error.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * 404 Route Not Found Handler
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: [${req.method}] ${req.originalUrl}`
  });
};

module.exports = { errorHandler, notFound };
