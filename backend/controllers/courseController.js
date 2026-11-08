const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const Review = require('../models/Review');
const Certificate = require('../models/Certificate');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { slugify } = require('../utils/slug');
const { withTransaction, sessionOpts } = require('../utils/transaction');

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function presentCourse(course, lessonCount = 0) {
  const instructor = course.instructor && course.instructor.name
    ? {
        id: course.instructor._id,
        name: course.instructor.name,
        headline: course.instructor.headline || '',
        bio: course.instructor.bio || '',
      }
    : { id: course.instructor, name: 'Instructor', headline: '', bio: '' };

  return {
    id: course._id,
    title: course.title,
    slug: course.slug,
    shortDescription: course.shortDescription,
    description: course.description,
    category: course.category,
    level: course.level,
    language: course.language,
    price: course.price,
    thumbnail: course.thumbnail,
    instructor,
    published: course.published,
    averageRating: course.averageRating,
    reviewCount: course.reviewCount,
    lessonCount,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
}

async function lessonCounts(courseIds) {
  if (!courseIds.length) return new Map();
  const rows = await Lesson.aggregate([
    { $match: { course: { $in: courseIds } } },
    { $group: { _id: '$course', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [String(row._id), row.count]));
}

function canManage(user, course) {
  if (!user) return false;
  return user.role === 'admin' || String(course.instructor._id || course.instructor) === String(user._id);
}

const listCourses = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(24, Math.max(1, Number.parseInt(req.query.limit, 10) || 9));
  const filter = { published: true };

  if (req.query.category) filter.category = req.query.category;
  if (req.query.level) filter.level = req.query.level;
  if (req.query.priceType === 'free') filter.price = 0;
  if (req.query.priceType === 'paid') filter.price = { $gt: 0 };
  if (req.query.q) {
    const pattern = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ title: pattern }, { shortDescription: pattern }, { description: pattern }];
  }

  const sortMap = {
    newest: { createdAt: -1 },
    popular: { reviewCount: -1, averageRating: -1, createdAt: -1 },
    rating: { averageRating: -1, reviewCount: -1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
  };
  const sort = sortMap[req.query.sort] || sortMap.newest;

  const [total, courses] = await Promise.all([
    Course.countDocuments(filter),
    Course.find(filter)
      .populate('instructor', 'name headline bio')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
  ]);
  const counts = await lessonCounts(courses.map((course) => course._id));

  res.json({
    success: true,
    data: {
      courses: courses.map((course) => presentCourse(course, counts.get(String(course._id)) || 0)),
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      total,
    },
  });
});

const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).populate('instructor', 'name headline bio');
  if (!course) throw new AppError('Course not found.', 404);
  if (!course.published && !canManage(req.user, course)) throw new AppError('Course not found.', 404);

  const lessons = await Lesson.find({ course: course._id }).sort({ order: 1 });
  let enrolled = false;
  if (req.user) {
    enrolled = Boolean(await Enrollment.exists({ student: req.user._id, course: course._id }));
  }
  const manager = canManage(req.user, course);
  const counts = lessons.length;

  res.json({
    success: true,
    data: {
      course: presentCourse(course, counts),
      lessons: lessons.map((lesson) => ({
        id: lesson._id,
        title: lesson.title,
        description: enrolled || manager ? lesson.description : '',
        videoUrl: enrolled || manager ? lesson.videoUrl : '',
        order: lesson.order,
        durationMinutes: lesson.durationMinutes,
        locked: !(enrolled || manager),
      })),
      enrolled,
      canManage: manager,
    },
  });
});

const createCourse = asyncHandler(async (req, res) => {
  const course = await Course.create({
    title: req.body.title,
    slug: slugify(req.body.title),
    shortDescription: req.body.shortDescription,
    description: req.body.description,
    category: req.body.category,
    level: req.body.level,
    language: req.body.language || 'English',
    price: Math.round(Number(req.body.price)),
    thumbnail: req.body.thumbnail || '',
    instructor: req.user.role === 'admin' && req.body.instructorId ? req.body.instructorId : req.user._id,
    published: Boolean(req.body.published),
  });
  const populated = await course.populate('instructor', 'name headline bio');
  res.status(201).json({ success: true, data: { course: presentCourse(populated, 0) } });
});

const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError('Course not found.', 404);
  if (!canManage(req.user, course)) throw new AppError('You can only edit your own courses.', 403);

  const fields = ['title', 'shortDescription', 'description', 'category', 'level', 'language', 'thumbnail', 'published'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) course[field] = req.body[field];
  });
  if (req.body.price !== undefined) course.price = Math.round(Number(req.body.price));
  if (req.body.title) course.slug = slugify(req.body.title);
  await course.save();
  await course.populate('instructor', 'name headline bio');
  const lessonCount = await Lesson.countDocuments({ course: course._id });
  res.json({ success: true, data: { course: presentCourse(course, lessonCount) } });
});

const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError('Course not found.', 404);
  if (!canManage(req.user, course)) throw new AppError('You can only delete your own courses.', 403);

  await withTransaction(async (session) => {
    const opts = sessionOpts(session);
    await Lesson.deleteMany({ course: course._id }, opts);
    await Enrollment.deleteMany({ course: course._id }, opts);
    await Review.deleteMany({ course: course._id }, opts);
    await Certificate.deleteMany({ course: course._id }, opts);
    await course.deleteOne(opts);
  });

  res.json({ success: true, message: 'Course deleted.' });
});

const myCourses = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { instructor: req.user._id };
  const courses = await Course.find(filter).populate('instructor', 'name headline bio').sort({ updatedAt: -1 });
  const counts = await lessonCounts(courses.map((course) => course._id));
  const enrollmentRows = await Enrollment.aggregate([
    { $match: { course: { $in: courses.map((course) => course._id) } } },
    { $group: { _id: '$course', count: { $sum: 1 } } },
  ]);
  const enrollmentMap = new Map(enrollmentRows.map((row) => [String(row._id), row.count]));

  res.json({
    success: true,
    data: {
      courses: courses.map((course) => ({
        ...presentCourse(course, counts.get(String(course._id)) || 0),
        enrollmentCount: enrollmentMap.get(String(course._id)) || 0,
      })),
    },
  });
});

module.exports = {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  myCourses,
  presentCourse,
  canManage,
};
