/**
 * Envuelve controladores async para que sus rechazos lleguen al
 * middleware global de errores sin try/catch repetitivos.
 */
const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

module.exports = { asyncHandler };
