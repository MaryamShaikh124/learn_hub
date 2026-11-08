const Review = require('../models/Review');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

async function refreshRating(courseId) {
  const [stats] = await Review.aggregate([
    { $match: { course: courseId } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Course.findByIdAndUpdate(courseId, {
    averageRating: stats ? Math.round(stats.average * 10) / 10 : 0,
    reviewCount: stats ? stats.count : 0,
  });
}

const listReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ course: req.params.courseId })
    .populate('student', 'name')
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({
    success: true,
    data: {
      reviews: reviews.map((review) => ({
        id: review._id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        student: { id: review.student?._id, name: review.student?.name || 'Student' },
      })),
    },
  });
});

const createReview = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course || !course.published) throw new AppError('Course not found.', 404);
  const enrolled = await Enrollment.exists({ student: req.user._id, course: course._id });
  if (!enrolled) throw new AppError('Only enrolled students can review this course.', 403);
  const existing = await Review.findOne({ student: req.user._id, course: course._id });
  if (existing) throw new AppError('You have already reviewed this course.', 409);

  const review = await Review.create({
    student: req.user._id,
    course: course._id,
    rating: Number(req.body.rating),
    comment: req.body.comment,
  });
  await refreshRating(course._id);
  await Notification.create({
    recipient: course.instructor,
    type: 'review',
    title: 'New course review',
    message: `${req.user.name} rated ${course.title} ${review.rating}/5.`,
    link: `/courses/${course._id}`,
  });
  res.status(201).json({ success: true, data: { reviewId: review._id } });
});

module.exports = { listReviews, createReview, refreshRating };
