const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const asyncHandler = require('../utils/asyncHandler');
const { CATEGORIES } = require('../utils/constants');

const publicStats = asyncHandler(async (req, res) => {
  const [courses, instructors, students, enrollments, categoryRows] = await Promise.all([
    Course.countDocuments({ published: true }),
    User.countDocuments({ role: 'instructor', isActive: true }),
    User.countDocuments({ role: 'student', isActive: true }),
    Enrollment.countDocuments(),
    Course.aggregate([
      { $match: { published: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
  ]);
  const counts = new Map(categoryRows.map((row) => [row._id, row.count]));
  res.json({
    success: true,
    data: {
      courses,
      instructors,
      students,
      enrollments,
      categories: CATEGORIES.map((name) => ({ name, count: counts.get(name) || 0 })),
    },
  });
});

const health = asyncHandler(async (req, res) => {
  const mongoose = require('mongoose');
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    success: connected,
    data: {
      service: 'learnhub-api',
      database: connected ? 'connected' : 'disconnected',
    },
  });
});

module.exports = { publicStats, health };
