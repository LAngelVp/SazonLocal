/**
 * Reglas de negocio de autenticación.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { readSheet, appendRecord } = require('./sheets.service');
const { ApiError } = require('../utils/ApiError');
const { generateId } = require('../utils/ids');
const { cleanString, normalizeText, normalizePhone, isTruthySheetValue } = require('../utils/normalize');
const { assertEmail, assertPassword } = require('../utils/validators');

const SALT_ROUNDS = 10;

function getJwtSecret() {
  if (!env.jwt.secret) {
    throw new ApiError(500, 'JWT_SECRET no está configurado en el servidor.', 'CONFIG_ERROR');
  }
  return env.jwt.secret;
}

function signToken(user) {
  return jwt.sign(
    {
      id_usuario: user.id_usuario,
      email: user.email,
      nombre_completo: user.nombre_completo,
    },
    getJwtSecret(),
    { expiresIn: env.jwt.expiresIn, issuer: 'sazon-local' }
  );
}

/** Solo expone los campos públicos del usuario. */
function toPublicUser(record) {
  return {
    id_usuario: record.id_usuario,
    nombre_completo: record.nombre_completo,
    email: record.email,
    telefono: record.telefono,
    fecha_registro: record.fecha_registro,
  };
}

async function listUsers() {
  const rows = await readSheet('users');
  return rows.map((row) => row.data);
}

async function findUserByEmail(email) {
  const target = normalizeText(email);
  const users = await listUsers();
  return users.find((user) => normalizeText(user.email) === target) || null;
}

async function findUserById(idUsuario) {
  const users = await listUsers();
  return users.find((user) => user.id_usuario === idUsuario) || null;
}

/**
 * Registra un usuario nuevo, validando duplicados por email.
 */
async function registerUser({ nombre_completo, email, password, telefono }) {
  const nombre = cleanString(nombre_completo, 120);
  const correo = cleanString(email, 160).toLowerCase();
  const telefonoLimpio = normalizePhone(telefono);

  if (!nombre) {
    throw new ApiError(400, 'El nombre completo es obligatorio.', 'INVALID_NAME');
  }
  assertEmail(correo);
  assertPassword(password);

  if (telefono && telefonoLimpio.length < 10) {
    throw new ApiError(400, 'El teléfono debe tener al menos 10 dígitos.', 'INVALID_PHONE');
  }

  const existing = await findUserByEmail(correo);
  if (existing) {
    throw new ApiError(409, 'Ya existe una cuenta registrada con este correo.', 'EMAIL_ALREADY_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const record = {
    id_usuario: generateId('USR'),
    nombre_completo: nombre,
    email: correo,
    password_hash: passwordHash,
    telefono: telefonoLimpio,
    fecha_registro: new Date().toISOString(),
    activo: 'TRUE',
  };

  await appendRecord('users', record);

  return {
    token: signToken(record),
    user: toPublicUser(record),
  };
}

/**
 * Autentica un usuario activo y devuelve un JWT de 24 h (configurable).
 */
async function loginUser({ email, password }) {
  const correo = cleanString(email, 160).toLowerCase();

  if (!correo || !password) {
    throw new ApiError(400, 'Ingresa tu correo y contraseña.', 'MISSING_CREDENTIALS');
  }

  const user = await findUserByEmail(correo);

  // Mensaje genérico para no revelar si el correo existe.
  if (!user) {
    throw new ApiError(401, 'Correo o contraseña incorrectos.', 'INVALID_CREDENTIALS');
  }

  if (!isTruthySheetValue(user.activo)) {
    throw new ApiError(403, 'Esta cuenta está desactivada. Contacta al administrador.', 'ACCOUNT_INACTIVE');
  }

  const passwordMatches = await bcrypt.compare(String(password), user.password_hash || '');
  if (!passwordMatches) {
    throw new ApiError(401, 'Correo o contraseña incorrectos.', 'INVALID_CREDENTIALS');
  }

  return {
    token: signToken(user),
    user: toPublicUser(user),
  };
}

module.exports = {
  SALT_ROUNDS,
  signToken,
  toPublicUser,
  listUsers,
  findUserByEmail,
  findUserById,
  registerUser,
  loginUser,
};
