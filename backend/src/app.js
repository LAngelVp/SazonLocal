/**
 * Aplicación Express de SazónLocal.
 *
 * Se exporta directamente para que Vercel la use como Serverless Function.
 * El mismo router se monta en `/api` y en `/`, de modo que funciona tanto si
 * Vercel conserva el prefijo como si el rewrite lo elimina.
 */
const express = require('express');
const cors = require('cors');
const { env } = require('./config/env');
const apiRoutes = require('./routes');
const { notFoundHandler } = require('./middlewares/notFoundHandler');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

const { ApiError } = require('./utils/ApiError');

// ---------- CORS ----------
const corsOptions = {
  origin(origin, callback) {
    // Peticiones same-origin (Vercel) y herramientas sin Origin.
    if (!origin) return callback(null, true);

    const allowed =
      env.corsOrigin.includes('*') ||
      env.corsOrigin.includes(origin) ||
      (env.nodeEnv !== 'production' && /^http:\/\/localhost:\d+$/.test(origin));

    if (allowed) return callback(null, true);
    return callback(new ApiError(403, `Origen no permitido por CORS: ${origin}`, 'CORS_BLOCKED'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Límite amplio para permitir imágenes base64 (subida opcional a ImgBB).
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ---------- Normalización para Vercel ----------
app.use((req, _res, next) => {
  // El rewrite de vercel.json envía /api/... a /api/index.js y conserva la
  // subruta original en __vercel_path. Reconstruimos la URL para que Express
  // la enrute igual que en local.
  const capturedPath = req.query?.__vercel_path;

  if (typeof capturedPath === 'string' && capturedPath.trim() !== '') {
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(req.query || {})) {
      if (key === '__vercel_path' || value === undefined) continue;
      if (Array.isArray(value)) {
        value.forEach((item) => query.append(key, String(item)));
      } else {
        query.append(key, String(value));
      }
    }

    const cleanPath = capturedPath.replace(/^\/+/, '');
    const queryString = query.toString();
    req.url = `/api/${cleanPath}${queryString ? `?${queryString}` : ''}`;
  } else if (req.url.startsWith('/api/index.js')) {
    // Fallback: si Vercel entrega la ruta interna de la función, la limpiamos.
    const rest = req.url.slice('/api/index.js'.length);
    req.url = rest === '' ? '/' : rest;
  }

  next();
});

// ---------- Metadatos de la API ----------
const apiInfo = (_req, res) => {
  res.status(200).json({
    name: 'SazónLocal API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me',
      businesses: 'GET /api/businesses',
      myBusinesses: 'GET /api/businesses/mine',
      createBusiness: 'POST /api/businesses',
      updateBusiness: 'PUT /api/businesses/:id',
      deleteBusiness: 'DELETE /api/businesses/:id',
      uploadImage: 'POST /api/uploads/image',
    },
  });
};

app.get('/', apiInfo);
app.get('/api', apiInfo);

app.use('/api', apiRoutes);
app.use('/', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
