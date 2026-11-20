/**
 * Capa de acceso a Google Sheets.
 *
 * Mantiene los encabezados exactos del proyecto y convierte filas en objetos
 * JSON. Todas las escrituras usan RAW para preservar teléfonos y textos.
 */
const { getSheetsClient, spreadsheetId } = require('../config/googleSheets');
const { ApiError } = require('../utils/ApiError');
const { cleanString, isEmptyRow } = require('../utils/normalize');

const SHEETS = {
  users: {
    name: 'Usuarios',
    headers: [
      'id_usuario',
      'nombre_completo',
      'email',
      'password_hash',
      'telefono',
      'fecha_registro',
      'activo',
    ],
  },
  businesses: {
    name: 'Negocios',
    headers: [
      'id_negocio',
      'id_usuario',
      'nombre_negocio',
      'localidad',
      'colonia_direccion',
      'tipo_negocio',
      'tipo_comida',
      'descripcion',
      'rango_precios',
      'horario',
      'whatsapp_telefono',
      'url_imagen',
      'enlace_maps',
      'servicios',
      'estado_publicacion',
      'fecha_creacion',
    ],
  },
};

function columnLetter(index) {
  let letter = '';
  let current = index + 1;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    current = Math.floor((current - 1) / 26);
  }
  return letter;
}

/**
 * Lee una pestaña completa y la transforma en objetos.
 * @param {'users'|'businesses'} sheetKey
 * @returns {Promise<Array<{ rowNumber: number, data: Record<string, string> }>>}
 */
async function readSheet(sheetKey) {
  const sheet = SHEETS[sheetKey];
  const sheets = getSheetsClient();

  let response;
  try {
    response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheet.name}!A1:ZZ10000`,
      valueRenderOption: 'FORMATTED_VALUE',
      dateTimeRenderOption: 'FORMATTED_STRING',
    });
  } catch (error) {
    throw new ApiError(
      502,
      `No se pudo leer la pestaña "${sheet.name}". Verifica que el Service Account tenga acceso al spreadsheet.`,
      'SHEETS_READ_ERROR',
      { reason: error.message }
    );
  }

  const values = response.data.values || [];
  if (values.length === 0) {
    throw new ApiError(
      500,
      `La pestaña "${sheet.name}" está vacía. Agrega la fila de encabezados indicada en el README.`,
      'SHEET_EMPTY'
    );
  }

  const headerRow = values[0].map((cell) => cleanString(cell));
  const missingHeaders = sheet.headers.filter((header) => !headerRow.includes(header));

  if (missingHeaders.length > 0) {
    throw new ApiError(
      500,
      `La pestaña "${sheet.name}" no tiene los encabezados esperados. Faltan: ${missingHeaders.join(', ')}.`,
      'INVALID_HEADERS',
      { missingHeaders }
    );
  }

  return values
    .slice(1)
    .map((row, index) => {
      const data = {};
      sheet.headers.forEach((header) => {
        const columnIndex = headerRow.indexOf(header);
        data[header] = columnIndex >= 0 ? cleanString(row[columnIndex], 4000) : '';
      });
      return { rowNumber: index + 2, data };
    })
    .filter((row) => !isEmptyRow(Object.values(row.data)));
}

/**
 * Agrega un registro al final de la pestaña respetando el orden de encabezados.
 * @param {'users'|'businesses'} sheetKey
 * @param {Record<string, string>} record
 */
async function appendRecord(sheetKey, record) {
  const sheet = SHEETS[sheetKey];
  const sheets = getSheetsClient();
  const values = [sheet.headers.map((header) => record[header] ?? '')];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheet.name}!A1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    });
  } catch (error) {
    throw new ApiError(
      502,
      `No se pudo guardar el registro en la pestaña "${sheet.name}".`,
      'SHEETS_WRITE_ERROR',
      { reason: error.message }
    );
  }
}

/**
 * Actualiza una fila existente. `rowNumber` es 1-based incluyendo encabezados.
 * @param {'users'|'businesses'} sheetKey
 * @param {number} rowNumber
 * @param {Record<string, string>} record
 */
async function updateRecord(sheetKey, rowNumber, record) {
  const sheet = SHEETS[sheetKey];
  const sheets = getSheetsClient();
  const lastColumn = columnLetter(sheet.headers.length - 1);
  const values = [sheet.headers.map((header) => record[header] ?? '')];

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheet.name}!A${rowNumber}:${lastColumn}${rowNumber}`,
      valueInputOption: 'RAW',
      requestBody: { values },
    });
  } catch (error) {
    throw new ApiError(
      502,
      `No se pudo actualizar la fila ${rowNumber} de la pestaña "${sheet.name}".`,
      'SHEETS_UPDATE_ERROR',
      { reason: error.message }
    );
  }
}

module.exports = { SHEETS, readSheet, appendRecord, updateRecord };
