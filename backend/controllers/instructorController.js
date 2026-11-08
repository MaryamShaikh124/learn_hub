const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');

const analytics = asyncHandler(async (req, res) => {
  const courses = await Course.find({ instructor: req.user._id }).select('title price averageRating reviewCount published');
  const courseIds = courses.map((course) => course._id);

  const [enrollmentStats, recent, rating] = await Promise.all([
    Enrollment.aggregate([
      { $match: { course: { $in: courseIds } } },
      {
        $group: {
          _id: '$course',
          enrollments: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          averageProgress: { $avg: '$progress' },
        },
      },
    ]),
    Enrollment.find({ course: { $in: courseIds } })
      .populate('student', 'name email')
      .populate('course', 'title')
      .sort({ enrolledAt: -1 })
      .limit(8),
    courseIds.length
      ? Review.aggregate([
          { $match: { course: { $in: courseIds } } },
          { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
        ])
      : [],
  ]);

  const byCourse = new Map(enrollmentStats.map((row) => [String(row._id), row]));
  const totals = enrollmentStats.reduce(
    (acc, row) => {
      acc.enrollments += row.enrollments;
      acc.completed += row.completed;
      acc.inProgress += row.inProgress;
      return acc;
    },
    { enrollments: 0, completed: 0, inProgress: 0 }
  );

  res.json({
    success: true,
    data: {
      totals: {
        courses: courses.length,
        enrollments: totals.enrollments,
        completed: totals.completed,
        inProgress: totals.inProgress,
        averageRating: rating[0] ? Math.round(rating[0].average * 10) / 10 : 0,
        reviewCount: rating[0]?.count || 0,
      },
      courses: courses.map((course) => {
        const stats = byCourse.get(String(course._id));
        return {
          id: course._id,
          title: course.title,
          price: course.price,
          published: course.published,
          averageRating: course.averageRating,
          reviewCount: course.reviewCount,
          enrollments: stats?.enrollments || 0,
          completed: stats?.completed || 0,
          inProgress: stats?.inProgress || 0,
          averageProgress: stats ? Math.round(stats.averageProgress) : 0,
        };
      }),
      recentEnrollments: recent.map((item) => ({
        id: item._id,
        enrolledAt: item.enrolledAt,
        progress: item.progress,
        status: item.status,
        student: { name: item.student?.name || 'Student', email: item.student?.email || '' },
        course: { id: item.course?._id, title: item.course?.title || 'Course' },
      })),
    },
  });
});

const students = asyncHandler(async (req, res) => {
  const courseFilter = { instructor: req.user._id };
  if (req.query.courseId) courseFilter._id = req.query.courseId;
  const courses = await Course.find(courseFilter).select('_id title');
  const enrollments = await Enrollment.find({ course: { $in: courses.map((course) => course._id) } })
    .populate('student', 'name email')
    .populate('course', 'title')
    .sort({ enrolledAt: -1 });

  res.json({
    success: true,
    data: {
      courses: courses.map((course) => ({ id: course._id, title: course.title })),
      students: enrollments
        .filter((item) => item.student && item.course)
        .map((item) => ({
          id: item._id,
          enrolledAt: item.enrolledAt,
          progress: item.progress,
          status: item.status,
          student: { id: item.student._id, name: item.student.name, email: item.student.email },
          course: { id: item.course._id, title: item.course.title },
        })),
    },
  });
});

module.exports = { analytics, students };
