/**
 * Error de aplicación con código HTTP y código interno opcional.
 */
class ApiError extends Error {
  constructor(statusCode, message, code = null, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

module.exports = { ApiError };
