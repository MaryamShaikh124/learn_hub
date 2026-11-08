const express = require('express');
const { protect } = require('../middleware/auth');
const enrollments = require('../controllers/enrollmentController');

const router = express.Router();

router.get('/me', protect, enrollments.myEnrollments);
router.post('/free/:courseId', protect, enrollments.enrollFree);
router.get('/learn/:courseId', protect, enrollments.learnCourse);
router.post('/:courseId/lessons/:lessonId/complete', protect, enrollments.completeLesson);

module.exports = router;
