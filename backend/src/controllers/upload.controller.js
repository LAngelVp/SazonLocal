/**
 * Subida opcional de imágenes a ImgBB.
 *
 * El frontend envía la imagen como Data URL (base64) y el backend la reenvía
 * a la API de ImgBB para no exponer la API key en el navegador.
 * Si IMGBB_API_KEY no está configurada, el formulario sigue funcionando con
 * URLs pegadas manualmente.
 */
const { asyncHandler } = require('../utils/asyncHandler');
const { env } = require('../config/env');
const { ApiError } = require('../utils/ApiError');

const MAX_BASE64_LENGTH = 7 * 1024 * 1024; // ~5 MB de imagen binaria

const uploadImage = asyncHandler(async (req, res) => {
  if (!env.imgbbApiKey) {
    throw new ApiError(
      503,
      'La subida de imágenes no está configurada. Pega la URL pública de tu imagen.',
      'IMGBB_NOT_CONFIGURED'
    );
  }

  const rawImage = req.body?.image;
  if (typeof rawImage !== 'string' || rawImage.trim() === '') {
    throw new ApiError(400, 'Envía la imagen en el campo "image" como Data URL base64.', 'MISSING_IMAGE');
  }

  const base64 = rawImage.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '').trim();

  if (base64.length > MAX_BASE64_LENGTH) {
    throw new ApiError(413, 'La imagen supera el límite de 5 MB.', 'IMAGE_TOO_LARGE');
  }

  const body = new URLSearchParams();
  body.set('image', base64);
  body.set('name', `sazon-local-${Date.now()}`);

  let response;
  try {
    response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(env.imgbbApiKey)}`, {
      method: 'POST',
      body,
    });
  } catch (error) {
    throw new ApiError(502, 'No se pudo contactar a ImgBB.', 'IMGBB_NETWORK_ERROR', { reason: error.message });
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload?.data?.url) {
    throw new ApiError(
      502,
      payload?.error?.message || 'ImgBB rechazó la imagen. Intenta con otra o pega una URL.',
      'IMGBB_UPLOAD_FAILED'
    );
  }

  res.status(201).json({
    url: payload.data.url,
    thumbnail: payload.data.thumb?.url || payload.data.url,
    deleteUrl: payload.data.delete_url || null,
  });
});

module.exports = { uploadImage };
