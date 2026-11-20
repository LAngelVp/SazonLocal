/**
 * Middleware global de manejo de errores.
 * Devuelve siempre un JSON consistente: { error: { message, code, details } }.
 */
const { env } = require('../config/env');

// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || error.status || 500;

  if (statusCode >= 500) {
    console.error('[SazónLocal API]', error);
  }

  const response = {
    error: {
      message:
        statusCode < 500 || error.isOperational || !env.isProduction
          ? error.message || 'Ocurrió un error inesperado.'
          : 'Ocurrió un error inesperado. Intenta de nuevo más tarde.',
      code: error.code || 'INTERNAL_ERROR',
    },
  };

  if (error.details) response.error.details = error.details;
  if (!env.isProduction && error.stack) response.error.stack = error.stack;

  res.status(statusCode).json(response);
}

module.exports = { errorHandler };
