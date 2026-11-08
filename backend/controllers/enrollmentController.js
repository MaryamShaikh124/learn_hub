const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { recalculateEnrollment, issueCertificateIfComplete } = require('../utils/learning');
const { withTransaction } = require('../utils/transaction');

function presentEnrollment(enrollment) {
  const course = enrollment.course;
  return {
    id: enrollment._id,
    status: enrollment.status,
    progress: enrollment.progress,
    completedLessons: enrollment.completedLessons,
    enrolledAt: enrollment.enrolledAt,
    completedAt: enrollment.completedAt,
    course: course?.title
      ? {
          id: course._id,
          title: course.title,
          thumbnail: course.thumbnail,
          category: course.category,
          price: course.price,
          instructor: course.instructor?.name
            ? { id: course.instructor._id, name: course.instructor.name }
            : course.instructor,
        }
      : { id: course },
  };
}

async function enrollStudent({ studentId, course }) {
  const existing = await Enrollment.findOne({ student: studentId, course: course._id });
  if (existing) return { enrollment: existing, created: false };

  const enrollment = await Enrollment.create({
    student: studentId,
    course: course._id,
    enrolledAt: new Date(),
  });

  const student = await User.findById(studentId);
  await Notification.create({
    recipient: studentId,
    type: 'enrollment',
    title: 'You are enrolled',
    message: `You joined ${course.title}. Start with the first lesson whenever you are ready.`,
    link: `/learn/${course._id}`,
  });
  if (course.instructor) {
    await Notification.create({
      recipient: course.instructor,
      type: 'enrollment',
      title: 'New student enrolled',
      message: `${student?.name || 'A student'} enrolled in ${course.title}.`,
      link: '/instructor/students',
    });
  }
  return { enrollment, created: true };
}

const enrollFree = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course || !course.published) throw new AppError('Course not found.', 404);
  if (course.price > 0) throw new AppError('This course requires payment before enrollment.', 402);
  if (String(course.instructor) === String(req.user._id)) {
    throw new AppError('Instructors already have access to their own courses.', 400);
  }
  const { enrollment, created } = await enrollStudent({ studentId: req.user._id, course });
  if (!created) throw new AppError('You are already enrolled in this course.', 409);
  res.status(201).json({ success: true, data: { enrollmentId: enrollment._id } });
});

const myEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user._id })
    .populate({ path: 'course', populate: { path: 'instructor', select: 'name' } })
    .sort({ updatedAt: -1 });
  const certificates = await Certificate.find({ student: req.user._id });
  const certificateByCourse = new Map(certificates.map((item) => [String(item.course), item]));

  const visible = enrollments.filter((item) => item.course);
  res.json({
    success: true,
    data: {
      enrollments: visible.map((item) => ({
        ...presentEnrollment(item),
        certificateId: certificateByCourse.get(String(item.course._id))?._id || null,
      })),
      stats: {
        enrolled: visible.length,
        inProgress: visible.filter((item) => item.status !== 'completed').length,
        completed: visible.filter((item) => item.status === 'completed').length,
        certificates: certificates.length,
      },
    },
  });
});

const learnCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId).populate('instructor', 'name headline');
  if (!course) throw new AppError('Course not found.', 404);
  const manager = req.user.role === 'admin' || String(course.instructor._id || course.instructor) === String(req.user._id);
  const enrollment = await Enrollment.findOne({ student: req.user._id, course: course._id });
  if (!enrollment && !manager) throw new AppError('Enroll in this course before opening lessons.', 403);

  const lessons = await Lesson.find({ course: course._id }).sort({ order: 1 });
  res.json({
    success: true,
    data: {
      course: {
        id: course._id,
        title: course.title,
        category: course.category,
        thumbnail: course.thumbnail,
        instructor: { id: course.instructor._id || course.instructor, name: course.instructor.name || 'Instructor' },
      },
      lessons,
      enrollment: enrollment
        ? {
            id: enrollment._id,
            progress: enrollment.progress,
            status: enrollment.status,
            completedLessons: enrollment.completedLessons,
          }
        : { id: null, progress: 0, status: 'preview', completedLessons: [] },
      preview: !enrollment,
    },
  });
});

const completeLesson = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.courseId });
  if (!enrollment) throw new AppError('Enroll in this course before completing lessons.', 403);
  const lesson = await Lesson.findOne({ _id: req.params.lessonId, course: req.params.courseId });
  if (!lesson) throw new AppError('Lesson not found.', 404);

  if (!enrollment.completedLessons.some((id) => String(id) === String(lesson._id))) {
    enrollment.completedLessons.push(lesson._id);
  }

  const result = await withTransaction(async (session) => {
    const progress = await recalculateEnrollment(enrollment, session);
    const certificate = await issueCertificateIfComplete(enrollment, session);
    return { progress: progress.enrollment.progress, status: progress.enrollment.status, certificate };
  });

  res.json({
    success: true,
    data: {
      progress: result.progress,
      status: result.status,
      completedLessons: enrollment.completedLessons,
      certificateId: result.certificate?.certificate?._id || null,
    },
  });
});

module.exports = { enrollFree, myEnrollments, learnCourse, completeLesson, enrollStudent };
