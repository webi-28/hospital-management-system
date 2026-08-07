/**
 * Custom error class with HTTP status support.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async handler wrapper – eliminates try/catch boilerplate in controllers.
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global error handler middleware (must be last app.use).
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';

  // PostgreSQL unique-violation
  if (err.code === '23505') {
    statusCode = 409;
    message    = 'A record with this value already exists.';
  }

  // PostgreSQL foreign-key violation
  if (err.code === '23503') {
    statusCode = 400;
    message    = 'Referenced record does not exist.';
  }

  // PostgreSQL not-null violation
  if (err.code === '23502') {
    statusCode = 400;
    message    = `Field "${err.column}" is required.`;
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('[ERROR]', err);
    return res.status(statusCode).json({
      success: false,
      message,
      stack: err.stack,
    });
  }

  res.status(statusCode).json({ success: false, message });
};

module.exports = { AppError, asyncHandler, errorHandler };
