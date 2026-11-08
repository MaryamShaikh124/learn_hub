const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/error');
const { instructorRules } = require('../middleware/validators');
const admin = require('../controllers/adminController');
const payments = require('../controllers/paymentController');

const router = express.Router();

router.use(protect, authorize('admin'));
router.get('/overview', admin.overview);
router.get('/activity', admin.activity);
router.get('/payments', payments.listPayments);
router.get('/users', admin.listUsers);
router.post('/instructors', instructorRules, validate, admin.createInstructor);
router.patch('/users/:id', admin.updateUser);

module.exports = router;
