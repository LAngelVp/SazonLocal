/**
 * Middleware de autenticación JWT.
 * Espera el header: Authorization: Bearer <token>
 */
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

function verifyToken(req, res, next) {
  const authorization = req.headers.authorization || '';

  if (!authorization.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        message: 'Acceso no autorizado. Inicia sesión para continuar.',
        code: 'MISSING_TOKEN',
      },
    });
  }

  const token = authorization.slice(7).trim();

  try {
    const payload = jwt.verify(token, env.jwt.secret, { issuer: 'sazon-local' });
    req.user = {
      id_usuario: payload.id_usuario,
      email: payload.email,
      nombre_completo: payload.nombre_completo,
    };
    return next();
  } catch (error) {
    const expired = error.name === 'TokenExpiredError';
    return res.status(401).json({
      error: {
        message: expired
          ? 'Tu sesión expiró. Vuelve a iniciar sesión.'
          : 'Token inválido. Vuelve a iniciar sesión.',
        code: expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
      },
    });
  }
}

module.exports = { verifyToken };
