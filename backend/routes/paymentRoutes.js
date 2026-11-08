const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const payments = require('../controllers/paymentController');

const router = express.Router();

router.use(protect);
router.get('/me', authorize('student'), payments.myPayments);
router.post('/checkout/:courseId', authorize('student'), payments.simulateCheckout);

module.exports = router;
