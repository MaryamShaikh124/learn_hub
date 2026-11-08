const express = require('express');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/error');
const { registerRules, loginRules, profileRules, passwordRules } = require('../middleware/validators');
const auth = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerRules, validate, auth.register);
router.post('/login', loginRules, validate, auth.login);
router.get('/me', protect, auth.me);
router.put('/profile', protect, profileRules, validate, auth.updateProfile);
router.put('/password', protect, passwordRules, validate, auth.changePassword);

module.exports = router;
