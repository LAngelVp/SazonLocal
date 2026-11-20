const { ApiError } = require('./ApiError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function assertEmail(email) {
  if (!EMAIL_REGEX.test(email)) {
    throw new ApiError(400, 'Ingresa un correo electrónico válido.', 'INVALID_EMAIL');
  }
}

function assertPassword(password) {
  if (typeof password !== 'string' || password.length < 6) {
    throw new ApiError(400, 'La contraseña debe tener al menos 6 caracteres.', 'INVALID_PASSWORD');
  }
  if (password.length > 100) {
    throw new ApiError(400, 'La contraseña no puede exceder 100 caracteres.', 'INVALID_PASSWORD');
  }
}

/**
 * Valida los campos obligatorios de un negocio.
 * @param {Record<string, unknown>} payload
 * @param {string[]} requiredFields
 */
function assertRequiredFields(payload, requiredFields) {
  const missing = requiredFields.filter((field) => {
    const value = payload[field];
    return value === null || value === undefined || String(value).trim() === '';
  });

  if (missing.length > 0) {
    throw new ApiError(
      400,
      `Faltan campos obligatorios: ${missing.join(', ')}.`,
      'MISSING_FIELDS',
      { missing }
    );
  }
}

module.exports = { EMAIL_REGEX, assertEmail, assertPassword, assertRequiredFields };
