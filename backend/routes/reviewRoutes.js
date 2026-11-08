const express = require('express');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/error');
const { reviewRules } = require('../middleware/validators');
const reviews = require('../controllers/reviewController');

const router = express.Router();

router.get('/:courseId', reviews.listReviews);
router.post('/:courseId', protect, reviewRules, validate, reviews.createReview);

module.exports = router;
