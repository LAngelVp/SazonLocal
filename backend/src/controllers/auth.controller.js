const { asyncHandler } = require('../utils/asyncHandler');
const { loginUser, registerUser, toPublicUser, findUserById } = require('../services/auth.service');
const { ApiError } = require('../utils/ApiError');

/**
 * POST /api/auth/register
 * Crea un usuario, encripta la contraseña con bcrypt (10 rondas) y devuelve JWT.
 */
const register = asyncHandler(async (req, res) => {
  const result = await registerUser(req.body || {});
  res.status(201).json(result);
});

/**
 * POST /api/auth/login
 * Verifica credenciales, cuenta activa y devuelve JWT de 24 h.
 */
const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body || {});
  res.status(200).json(result);
});

/**
 * GET /api/auth/me
 * Permite restaurar la sesión desde el frontend con el token guardado.
 */
const me = asyncHandler(async (req, res) => {
  const user = await findUserById(req.user.id_usuario);

  if (!user) {
    throw new ApiError(404, 'El usuario de la sesión ya no existe.', 'USER_NOT_FOUND');
  }

  res.status(200).json({ user: toPublicUser(user) });
});

module.exports = { register, login, me };
