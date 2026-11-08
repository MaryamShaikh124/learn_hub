const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Review = require('../models/Review');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const overview = asyncHandler(async (req, res) => {
  const [users, students, instructors, courses, enrollments, completed, recentUsers, recentEnrollments] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'instructor' }),
    Course.countDocuments(),
    Enrollment.countDocuments(),
    Enrollment.countDocuments({ status: 'completed' }),
    User.find().sort({ createdAt: -1 }).limit(6).select('name email role createdAt isActive'),
    Enrollment.find().populate('student', 'name').populate('course', 'title').sort({ enrolledAt: -1 }).limit(6),
  ]);

  res.json({
    success: true,
    data: {
      totals: {
        users,
        students,
        instructors,
        courses,
        enrollments,
        completed,
        inProgress: enrollments - completed,
      },
      recentUsers: recentUsers.map((user) => user.toSafeObject()),
      recentEnrollments: recentEnrollments.map((item) => ({
        id: item._id,
        enrolledAt: item.enrolledAt,
        status: item.status,
        student: item.student?.name || 'Student',
        course: item.course?.title || 'Course',
      })),
    },
  });
});

const listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.q) {
    const pattern = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }];
  }
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, data: { users: users.map((user) => user.toSafeObject()) } });
});

const createInstructor = asyncHandler(async (req, res) => {
  const existing = await User.findOne({ email: req.body.email });
  if (existing) throw new AppError('An account with this email already exists.', 409);
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: 'instructor',
    headline: 'Instructor',
  });
  res.status(201).json({ success: true, data: { user: user.toSafeObject() } });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found.', 404);
  if (String(user._id) === String(req.user._id) && (req.body.role || req.body.isActive === false)) {
    throw new AppError('You cannot change your own role or deactivate yourself.', 400);
  }
  if (req.body.role) {
    if (!['student', 'instructor', 'admin'].includes(req.body.role)) throw new AppError('Invalid role.', 400);
    if (user.role === 'admin' && req.body.role !== 'admin') {
      const admins = await User.countDocuments({ role: 'admin', isActive: true });
      if (admins <= 1) throw new AppError('At least one active administrator is required.', 400);
    }
    user.role = req.body.role;
  }
  if (req.body.isActive !== undefined) user.isActive = Boolean(req.body.isActive);
  await user.save();
  res.json({ success: true, data: { user: user.toSafeObject() } });
});

const activity = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate('student', 'name')
    .populate('course', 'title')
    .sort({ createdAt: -1 })
    .limit(8);
  res.json({
    success: true,
    data: {
      reviews: reviews.map((review) => ({
        id: review._id,
        rating: review.rating,
        createdAt: review.createdAt,
        student: review.student?.name || 'Student',
        course: review.course?.title || 'Course',
      })),
    },
  });
});

module.exports = { overview, listUsers, createInstructor, updateUser, activity };
