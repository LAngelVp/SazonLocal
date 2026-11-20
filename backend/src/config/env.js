/**
 * Configuración centralizada de variables de entorno.
 *
 * Se cargan con dotenv en desarrollo local. En Vercel las variables llegan
 * directamente en process.env, por lo que dotenv simplemente no encuentra
 * archivo y continúa sin errores.
 */
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

/**
 * Normaliza la clave privada de Google: en Vercel suele guardarse con los
 * saltos de línea escapados como "\\n" y comillas envolventes.
 */
function normalizePrivateKey(value) {
  if (!value) return '';
  return value
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\\n/g, '\n');
}

const env = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:4200')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  google: {
    sheetId: (process.env.GOOGLE_SHEET_ID || '').trim(),
    serviceAccountEmail: (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim(),
    privateKey: normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY),
  },

  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  businesses: {
    autoApproveStatus: (process.env.AUTO_APPROVE_BUSINESS || 'APROBADO').toUpperCase(),
    cacheTtlMs: Number(process.env.BUSINESSES_CACHE_TTL_MS || 30000),
  },

  imgbbApiKey: (process.env.IMGBB_API_KEY || '').trim(),
};

const REQUIRED_VARS = ['GOOGLE_SHEET_ID', 'GOOGLE_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_PRIVATE_KEY', 'JWT_SECRET'];

/**
 * Valida la configuración antes de arrancar el servidor local.
 * No se ejecuta automáticamente al importar para que Vercel pueda
 * responder errores controlados en lugar de fallar en el arranque.
 */
function assertEnv() {
  const missing = REQUIRED_VARS.filter((name) => {
    const value = process.env[name];
    return !value || !String(value).trim();
  });

  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno obligatorias: ${missing.join(', ')}`);
  }

  if (env.jwt.secret.length < 16) {
    throw new Error('JWT_SECRET debe tener al menos 16 caracteres para ser seguro.');
  }
}

module.exports = { env, assertEnv };
