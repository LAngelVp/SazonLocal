/**
 * Catch-all opcional de la API.
 *
 * Vercel crea una función para cada archivo dentro de /api. Este archivo
 * garantiza que cualquier subruta (/api/auth/login, /api/businesses, etc.)
 * llegue a la misma app de Express incluso si el rewrite de vercel.json no
 * se aplica por alguna razón. La lógica vive en un único lugar.
 */
const app = require('../backend/src/app');

module.exports = app;
