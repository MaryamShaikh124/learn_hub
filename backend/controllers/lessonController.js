const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { canManage } = require('./courseController');
const { recalculateEnrollment } = require('../utils/learning');

async function loadManagedCourse(req) {
  const course = await Course.findById(req.params.courseId || req.body.courseId);
  if (!course) throw new AppError('Course not found.', 404);
  if (!canManage(req.user, course)) throw new AppError('You can only manage lessons for your own courses.', 403);
  return course;
}

const createLesson = asyncHandler(async (req, res) => {
  const course = await loadManagedCourse(req);
  let order = Number.parseInt(req.body.order, 10);
  if (!order) {
    const last = await Lesson.findOne({ course: course._id }).sort({ order: -1 });
    order = last ? last.order + 1 : 1;
  }
  const lesson = await Lesson.create({
    course: course._id,
    title: req.body.title,
    description: req.body.description || '',
    videoUrl: req.body.videoUrl,
    order,
    durationMinutes: Number(req.body.durationMinutes) || 0,
  });
  const enrollments = await Enrollment.find({ course: course._id });
  for (const enrollment of enrollments) {
    await recalculateEnrollment(enrollment);
  }
  res.status(201).json({ success: true, data: { lesson } });
});

const updateLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw new AppError('Lesson not found.', 404);
  req.params.courseId = lesson.course.toString();
  await loadManagedCourse(req);

  ['title', 'description', 'videoUrl', 'order', 'durationMinutes'].forEach((field) => {
    if (req.body[field] !== undefined) lesson[field] = req.body[field];
  });
  await lesson.save();
  res.json({ success: true, data: { lesson } });
});

const deleteLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw new AppError('Lesson not found.', 404);
  req.params.courseId = lesson.course.toString();
  await loadManagedCourse(req);
  const courseId = lesson.course;
  await lesson.deleteOne();
  const enrollments = await Enrollment.find({ course: courseId });
  for (const enrollment of enrollments) {
    await recalculateEnrollment(enrollment);
  }
  res.json({ success: true, message: 'Lesson deleted.' });
});

const reorderLessons = asyncHandler(async (req, res) => {
  const course = await loadManagedCourse(req);
  const lessonIds = Array.isArray(req.body.lessonIds) ? req.body.lessonIds : [];
  const lessons = await Lesson.find({ course: course._id });
  if (lessonIds.length !== lessons.length) throw new AppError('Provide every lesson in the new order.', 400);
  const known = new Set(lessons.map((lesson) => lesson._id.toString()));
  if (lessonIds.some((id) => !known.has(String(id)))) throw new AppError('Lesson list does not match this course.', 400);

  await Lesson.bulkWrite(
    lessonIds.map((id, index) => ({
      updateOne: { filter: { _id: id, course: course._id }, update: { $set: { order: 1000 + index + 1 } } },
    }))
  );
  await Lesson.bulkWrite(
    lessonIds.map((id, index) => ({
      updateOne: { filter: { _id: id, course: course._id }, update: { $set: { order: index + 1 } } },
    }))
  );
  const ordered = await Lesson.find({ course: course._id }).sort({ order: 1 });
  res.json({ success: true, data: { lessons: ordered } });
});

module.exports = { createLesson, updateLesson, deleteLesson, reorderLessons };
