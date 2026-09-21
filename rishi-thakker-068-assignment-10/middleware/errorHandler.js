// Centralized fallback error handler. Route handlers in this project mostly
// catch and respond directly, but this catches anything unexpected that
// bubbles up via next(err), plus malformed JSON body errors from express.json().
const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err.message);

  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Something went wrong",
  });
};

module.exports = errorHandler;
