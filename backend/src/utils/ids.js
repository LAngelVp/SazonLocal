const crypto = require('crypto');

/**
 * Genera identificadores legibles y únicos para las filas de Google Sheets.
 * Ejemplo: USR-M3K9X2-8F1A / NEG-M3K9X2-C7B4
 */
function generateId(prefix) {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

module.exports = { generateId };
