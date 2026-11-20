const { Router } = require('express');
const { uploadImage } = require('../controllers/upload.controller');
const { verifyToken } = require('../middlewares/verifyToken');

const router = Router();

router.post('/image', verifyToken, uploadImage);

module.exports = router;
