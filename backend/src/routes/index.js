const { Router } = require('express');
const authRoutes = require('./auth.routes');
const businessRoutes = require('./business.routes');
const uploadRoutes = require('./upload.routes');

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'sazon-local-api',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/businesses', businessRoutes);
router.use('/uploads', uploadRoutes);

module.exports = router;
