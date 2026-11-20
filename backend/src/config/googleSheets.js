/**
 * Cliente oficial de Google Sheets.
 *
 * Se autentica con una Service Account (JWT) y reutiliza el cliente entre
 * invocaciones tibias de la función serverless.
 */
const { google } = require('googleapis');
const { env } = require('./env');

let sheetsClient = null;

function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  if (!env.google.sheetId || !env.google.serviceAccountEmail || !env.google.privateKey) {
    throw new Error(
      'Configuración de Google Sheets incompleta. Revisa GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_PRIVATE_KEY.'
    );
  }

  const auth = new google.auth.JWT({
    email: env.google.serviceAccountEmail,
    key: env.google.privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

module.exports = { getSheetsClient, spreadsheetId: env.google.sheetId };
