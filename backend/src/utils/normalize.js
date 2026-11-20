const { ApiError } = require('./ApiError');

/**
 * Limpia cadenas recibidas del exterior: convierte a string, recorta espacios
 * y elimina caracteres de control.
 */
function cleanString(value, maxLength = 1000) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

/** Normaliza para comparar sin acentos ni mayúsculas. */
function normalizeText(value) {
  return cleanString(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Normaliza números telefónicos dejando solo dígitos y un posible + inicial. */
function normalizePhone(value) {
  const raw = cleanString(value, 30);
  const digits = raw.replace(/\D/g, '');
  return digits;
}

/** Deja solo los dígitos de un teléfono (útil para enlaces wa.me). */
function digitsOnly(value) {
  return cleanString(value, 40).replace(/\D/g, '');
}

/**
 * Convierte un valor de Sheet en booleano. Sheets entrega strings como
 * "TRUE", "TRUE " o vacío.
 */
function isTruthySheetValue(value) {
  const normalized = normalizeText(value);
  return ['true', 'verdadero', '1', 'si', 'sí', 'activo'].includes(normalized);
}

/** Indica si una fila de Sheet está completamente vacía. */
function isEmptyRow(row) {
  return !Array.isArray(row) || row.every((cell) => cleanString(cell) === '');
}

module.exports = {
  cleanString,
  normalizeText,
  normalizePhone,
  digitsOnly,
  isTruthySheetValue,
  isEmptyRow,
};
