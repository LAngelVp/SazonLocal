const { Router } = require('express');
const { list, mine, create, update, remove, cacheStatus } = require('../controllers/business.controller');
const { verifyToken } = require('../middlewares/verifyToken');

const router = Router();

// Público (con caché en memoria en el servidor).
router.get('/', list);

// Diagnóstico del caché (no expone datos privados).
router.get('/cache-status', cacheStatus);

// Protegidos.
router.get('/mine', verifyToken, mine);
router.post('/', verifyToken, create);
router.put('/:id', verifyToken, update);
router.delete('/:id', verifyToken, remove);

module.exports = router;
