const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const instructor = require('../controllers/instructorController');

const router = express.Router();

router.use(protect, authorize('instructor'));
router.get('/analytics', instructor.analytics);
router.get('/students', instructor.students);

module.exports = router;
