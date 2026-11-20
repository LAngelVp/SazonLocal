const { ApiError } = require('../utils/ApiError');

/**
 * Rutas no encontradas dentro del namespace /api.
 * El fallback a index.html lo resuelve Vercel para las rutas del frontend.
 */
function notFoundHandler(req, res, next) {
  next(
    new ApiError(
      404,
      `La ruta ${req.method} ${req.originalUrl} no existe en la API.`,
      'ROUTE_NOT_FOUND'
    )
  );
}

module.exports = { notFoundHandler };
