const express = require('express');
const { protect } = require('../middleware/auth');
const certificates = require('../controllers/certificateController');

const router = express.Router();

router.get('/me', protect, certificates.myCertificates);
router.get('/:id', protect, certificates.getCertificate);

module.exports = router;
