const express = require('express');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/error');
const { courseRules } = require('../middleware/validators');
const courses = require('../controllers/courseController');

const router = express.Router();

router.get('/', courses.listCourses);
router.get('/manage/mine', protect, authorize('instructor', 'admin'), courses.myCourses);
router.get('/:id', optionalAuth, courses.getCourse);
router.post('/', protect, authorize('instructor', 'admin'), courseRules, validate, courses.createCourse);
router.put('/:id', protect, authorize('instructor', 'admin'), courseRules, validate, courses.updateCourse);
router.delete('/:id', protect, authorize('instructor', 'admin'), courses.deleteCourse);

module.exports = router;
