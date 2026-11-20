const { asyncHandler } = require('../utils/asyncHandler');
const {
  getApprovedBusinesses,
  getBusinessesByUser,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getCacheStatus,
} = require('../services/business.service');

/**
 * GET /api/businesses
 * Público. Devuelve únicamente negocios con estado APROBADO.
 * Utiliza caché en memoria (30 s por defecto).
 */
const list = asyncHandler(async (req, res) => {
  const forceRefresh = req.query.refresh === 'true';
  const businesses = await getApprovedBusinesses({ forceRefresh });

  res.set('Cache-Control', 'public, max-age=15, stale-while-revalidate=30');
  res.status(200).json(businesses);
});

/**
 * GET /api/businesses/mine
 * Protegido. Lista los negocios del usuario (incluye pendientes).
 */
const mine = asyncHandler(async (req, res) => {
  const businesses = await getBusinessesByUser(req.user.id_usuario);
  res.status(200).json(businesses);
});

/**
 * POST /api/businesses
 * Protegido. Registra un negocio asociado al usuario del JWT.
 */
const create = asyncHandler(async (req, res) => {
  const business = await createBusiness(req.user.id_usuario, req.body || {});
  res.status(201).json(business);
});

/**
 * PUT /api/businesses/:id
 * Protegido. Solo el propietario puede actualizar su negocio.
 */
const update = asyncHandler(async (req, res) => {
  const business = await updateBusiness(req.params.id, req.user.id_usuario, req.body || {});
  res.status(200).json(business);
});

/**
 * DELETE /api/businesses/:id
 * Protegido. Solo el propietario puede eliminar; borra la fila del Sheet.
 */
const remove = asyncHandler(async (req, res) => {
  const result = await deleteBusiness(req.params.id, req.user.id_usuario);
  res.status(200).json({
    message: 'Negocio eliminado correctamente.',
    id_negocio: result.id_negocio,
    nombre_negocio: result.nombre_negocio,
  });
});

/**
 * GET /api/businesses/cache-status
 * Diagnóstico del caché en memoria (útil para depurar límites de Sheets).
 */
const cacheStatus = asyncHandler(async (_req, res) => {
  res.status(200).json(getCacheStatus());
});

module.exports = { list, mine, create, update, remove, cacheStatus };
