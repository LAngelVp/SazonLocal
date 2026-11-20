/**
 * Reglas de negocio para el directorio gastronómico.
 */
const { env } = require('../config/env');
const { BUSINESS_TYPES, FOOD_TYPES, PRICE_RANGES, SERVICES } = require('../config/businessOptions');
const { readSheet, appendRecord, updateRecord, deleteRecord } = require('./sheets.service');
const { createTtlCache } = require('./cache.service');
const { ApiError } = require('../utils/ApiError');
const { generateId } = require('../utils/ids');
const { cleanString, normalizePhone, normalizeText } = require('../utils/normalize');
const { assertRequiredFields } = require('../utils/validators');

/** Regla de negocio: máximo de negocios registrados por usuario. */
const MAX_BUSINESSES_PER_USER = 5;

const REQUIRED_FIELDS = [
  'nombre_negocio',
  'localidad',
  'colonia_direccion',
  'tipo_negocio',
  'tipo_comida',
  'descripcion',
  'rango_precios',
  'horario',
  'whatsapp_telefono',
];

const TEXT_LIMITS = {
  nombre_negocio: 120,
  localidad: 80,
  colonia_direccion: 200,
  descripcion: 700,
  menu: 1500,
  horario: 160,
  url_imagen: 600,
  enlace_maps: 600,
};

const approvedCache = createTtlCache(env.businesses.cacheTtlMs);

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function normalizeServices(value) {
  const rawList = Array.isArray(value)
    ? value
    : cleanString(value, 300)
        .split(/[,;|]/)
        .map((item) => item.trim());

  const selected = [];
  for (const item of rawList) {
    const match = SERVICES.find((service) => normalizeText(service) === normalizeText(item));
    if (match && !selected.includes(match)) selected.push(match);
  }
  return selected.join(', ');
}

/**
 * Valida y normaliza el cuerpo de un negocio.
 * @param {Record<string, unknown>} payload
 * @param {{ partial?: boolean, existing?: Record<string, string> }} options
 */
function buildBusinessData(payload, { partial = false, existing = null } = {}) {
  const source = { ...(existing || {}), ...(payload || {}) };

  if (!partial) {
    assertRequiredFields(source, REQUIRED_FIELDS);
  }

  if (source.menu !== undefined && source.menu !== null && String(source.menu).length > 1500) {
    throw new ApiError(
      400,
      'El menú o lista de platillos no puede exceder los 1500 caracteres.',
      'MENU_TOO_LONG'
    );
  }

  const data = {};

  for (const [field, limit] of Object.entries(TEXT_LIMITS)) {
    data[field] = cleanString(source[field], limit);
  }

  const tipoNegocio = cleanString(source.tipo_negocio, 60);
  const tipoComida = cleanString(source.tipo_comida, 60);
  const rangoPrecios = cleanString(source.rango_precios, 5);

  if (!partial || source.tipo_negocio !== undefined) {
    const match = BUSINESS_TYPES.find((type) => normalizeText(type) === normalizeText(tipoNegocio));
    if (!match) {
      throw new ApiError(400, `Tipo de negocio inválido. Opciones: ${BUSINESS_TYPES.join(', ')}.`, 'INVALID_BUSINESS_TYPE');
    }
    data.tipo_negocio = match;
  }

  if (!partial || source.tipo_comida !== undefined) {
    const match = FOOD_TYPES.find((type) => normalizeText(type) === normalizeText(tipoComida));
    if (!match) {
      throw new ApiError(400, `Tipo de comida inválido. Opciones: ${FOOD_TYPES.join(', ')}.`, 'INVALID_FOOD_TYPE');
    }
    data.tipo_comida = match;
  }

  if (!partial || source.rango_precios !== undefined) {
    if (!PRICE_RANGES.includes(rangoPrecios)) {
      throw new ApiError(400, 'El rango de precios debe ser $, $$ o $$$.', 'INVALID_PRICE_RANGE');
    }
    data.rango_precios = rangoPrecios;
  }

  data.servicios = normalizeServices(source.servicios);

  const phoneDigits = normalizePhone(source.whatsapp_telefono);
  if (!partial || source.whatsapp_telefono !== undefined) {
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      throw new ApiError(400, 'El WhatsApp debe tener entre 10 y 15 dígitos (incluye lada del país).', 'INVALID_WHATSAPP');
    }
    data.whatsapp_telefono = phoneDigits;
  }

  if (data.url_imagen && !isHttpUrl(data.url_imagen)) {
    throw new ApiError(400, 'La URL de la imagen debe iniciar con http:// o https://.', 'INVALID_IMAGE_URL');
  }

  if (data.enlace_maps && !isHttpUrl(data.enlace_maps)) {
    throw new ApiError(400, 'El enlace de Google Maps debe iniciar con http:// o https://.', 'INVALID_MAPS_URL');
  }

  return data;
}

/** Objeto público (sin datos internos ni del propietario). */
function toPublicBusiness(record) {
  return {
    id_negocio: record.id_negocio,
    nombre_negocio: record.nombre_negocio,
    localidad: record.localidad,
    colonia_direccion: record.colonia_direccion,
    tipo_negocio: record.tipo_negocio,
    tipo_comida: record.tipo_comida,
    descripcion: record.descripcion,
    menu: record.menu,
    rango_precios: record.rango_precios,
    horario: record.horario,
    whatsapp_telefono: record.whatsapp_telefono,
    url_imagen: record.url_imagen,
    enlace_maps: record.enlace_maps,
    servicios: record.servicios,
    estado_publicacion: record.estado_publicacion,
    fecha_creacion: record.fecha_creacion,
  };
}

/**
 * Devuelve los negocios aprobados, usando caché en memoria durante 30 s.
 */
async function getApprovedBusinesses({ forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const cached = approvedCache.get();
    if (cached) return cached;
  }

  const rows = await readSheet('businesses');
  const approved = rows
    .map((row) => row.data)
    .filter((business) => normalizeText(business.estado_publicacion) === 'aprobado')
    .map(toPublicBusiness)
    .sort((a, b) => String(b.fecha_creacion).localeCompare(String(a.fecha_creacion)));

  approvedCache.set(approved);
  return approved;
}

/** Negocios del usuario autenticado, incluyendo pendientes. */
async function getBusinessesByUser(idUsuario) {
  const rows = await readSheet('businesses');
  return rows
    .map((row) => row.data)
    .filter((business) => business.id_usuario === idUsuario)
    .map((business) => ({ ...toPublicBusiness(business), id_usuario: business.id_usuario }))
    .sort((a, b) => String(b.fecha_creacion).localeCompare(String(a.fecha_creacion)));
}

/** Crea un negocio y lo publica con el estado configurado. */
async function createBusiness(idUsuario, payload) {
  if (!idUsuario) {
    throw new ApiError(401, 'Sesión inválida: no se encontró el usuario.', 'INVALID_TOKEN');
  }

  // Límite por propietario: se cuenta antes de insertar.
  const rows = await readSheet('businesses');
  const ownedCount = rows.filter((row) => row.data.id_usuario === idUsuario).length;

  if (ownedCount >= MAX_BUSINESSES_PER_USER) {
    throw new ApiError(
      400,
      `Has alcanzado el límite máximo de ${MAX_BUSINESSES_PER_USER} negocios registrados por usuario.`,
      'BUSINESS_LIMIT_REACHED',
      { limit: MAX_BUSINESSES_PER_USER, current: ownedCount }
    );
  }

  const data = buildBusinessData(payload, { partial: false });

  const record = {
    id_negocio: generateId('NEG'),
    id_usuario: idUsuario,
    ...data,
    estado_publicacion: env.businesses.autoApproveStatus,
    fecha_creacion: new Date().toISOString(),
  };

  await appendRecord('businesses', record);
  approvedCache.clear();

  return toPublicBusiness(record);
}

/** Actualiza un negocio validando que pertenezca al usuario autenticado. */
async function updateBusiness(idNegocio, idUsuario, payload) {
  const rows = await readSheet('businesses');
  const target = rows.find((row) => row.data.id_negocio === idNegocio);

  if (!target) {
    throw new ApiError(404, 'No encontramos el negocio indicado.', 'BUSINESS_NOT_FOUND');
  }

  if (target.data.id_usuario !== idUsuario) {
    throw new ApiError(403, 'No tienes permisos para editar este negocio.', 'FORBIDDEN');
  }

  const data = buildBusinessData(payload, { partial: true, existing: target.data });

  const updatedRecord = {
    ...target.data,
    ...data,
    id_negocio: target.data.id_negocio,
    id_usuario: target.data.id_usuario,
    estado_publicacion: target.data.estado_publicacion,
    fecha_creacion: target.data.fecha_creacion,
  };

  await updateRecord('businesses', target.rowNumber, updatedRecord);
  approvedCache.clear();

  return { ...toPublicBusiness(updatedRecord), id_usuario: updatedRecord.id_usuario };
}

/** Elimina un negocio validando propiedad y borrando la fila físicamente. */
async function deleteBusiness(idNegocio, idUsuario) {
  const rows = await readSheet('businesses');
  const target = rows.find((row) => row.data.id_negocio === idNegocio);

  if (!target) {
    throw new ApiError(404, 'No encontramos el negocio indicado.', 'BUSINESS_NOT_FOUND');
  }

  if (target.data.id_usuario !== idUsuario) {
    throw new ApiError(403, 'No tienes permisos para eliminar este negocio.', 'FORBIDDEN');
  }

  await deleteRecord('businesses', target.rowNumber);
  approvedCache.clear();

  return {
    id_negocio: target.data.id_negocio,
    nombre_negocio: target.data.nombre_negocio,
  };
}

function clearApprovedCache() {
  approvedCache.clear();
}

function getCacheStatus() {
  return approvedCache.status();
}

module.exports = {
  MAX_BUSINESSES_PER_USER,
  REQUIRED_FIELDS,
  buildBusinessData,
  toPublicBusiness,
  getApprovedBusinesses,
  getBusinessesByUser,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  clearApprovedCache,
  getCacheStatus,
};
