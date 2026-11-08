const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/error');
const { lessonRules } = require('../middleware/validators');
const lessons = require('../controllers/lessonController');

const router = express.Router();

router.post('/courses/:courseId/lessons', protect, authorize('instructor', 'admin'), lessonRules, validate, lessons.createLesson);
router.put('/courses/:courseId/lessons/reorder', protect, authorize('instructor', 'admin'), lessons.reorderLessons);
router.put('/lessons/:id', protect, authorize('instructor', 'admin'), lessonRules, validate, lessons.updateLesson);
router.delete('/lessons/:id', protect, authorize('instructor', 'admin'), lessons.deleteLesson);

module.exports = router;
