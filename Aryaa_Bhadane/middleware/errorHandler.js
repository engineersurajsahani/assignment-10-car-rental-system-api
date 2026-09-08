/**
 * Centralized error-handling middleware for Express.
 * Catches all thrown/forwarded errors and formats a uniform JSON error response.
 */
const errorHandler = (err, req, res, next) => {
  // Determine HTTP status code (defaults to 500 if unhandled)
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, {
    message: err.message,
    status: statusCode,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { details: err.details || err.stack }),
  });
};

module.exports = errorHandler;
