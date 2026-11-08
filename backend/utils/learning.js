const Lesson = require('../models/Lesson');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const Course = require('../models/Course');
const User = require('../models/User');
const crypto = require('crypto');
const { sessionOpts } = require('./transaction');

async function recalculateEnrollment(enrollment, session) {
  const total = await Lesson.countDocuments({ course: enrollment.course }).setOptions(sessionOpts(session));
  const validIds = new Set(
    (
      await Lesson.find({ course: enrollment.course }).select('_id').setOptions(sessionOpts(session))
    ).map((lesson) => lesson._id.toString())
  );
  const seen = new Set();
  enrollment.completedLessons = enrollment.completedLessons.filter((id) => {
    const key = id.toString();
    if (!validIds.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const completed = enrollment.completedLessons.length;
  enrollment.progress = total === 0 ? 0 : Math.round((completed / total) * 100);
  if (total > 0 && completed >= total) {
    enrollment.status = 'completed';
    enrollment.completedAt = enrollment.completedAt || new Date();
  } else {
    enrollment.status = 'active';
    enrollment.completedAt = null;
  }
  await enrollment.save(sessionOpts(session));
  return { enrollment, total, completed };
}

async function uniqueCertificateNumber(session) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const year = new Date().getFullYear();
    const number = `LH-${year}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const exists = await Certificate.exists({ certificateNumber: number }).setOptions(sessionOpts(session));
    if (!exists) return number;
  }
  throw new Error('Could not allocate a certificate number');
}

async function issueCertificateIfComplete(enrollment, session) {
  if (enrollment.status !== 'completed') return null;
  const existing = await Certificate.findOne({
    student: enrollment.student,
    course: enrollment.course,
  }).setOptions(sessionOpts(session));
  if (existing) return { certificate: existing, created: false };

  const [certificate] = await Certificate.create(
    [
      {
        student: enrollment.student,
        course: enrollment.course,
        enrollment: enrollment._id,
        certificateNumber: await uniqueCertificateNumber(session),
        issuedAt: new Date(),
      },
    ],
    sessionOpts(session)
  );

  const [course, student] = await Promise.all([
    Course.findById(enrollment.course).setOptions(sessionOpts(session)),
    User.findById(enrollment.student).setOptions(sessionOpts(session)),
  ]);

  await Notification.create(
    [
      {
        recipient: enrollment.student,
        type: 'certificate',
        title: 'Certificate issued',
        message: `You completed ${course?.title || 'a course'} and earned certificate ${certificate.certificateNumber}.`,
        link: `/certificates/${certificate._id}`,
      },
    ],
    sessionOpts(session)
  );

  if (course?.instructor && student) {
    await Notification.create(
      [
        {
          recipient: course.instructor,
          type: 'certificate',
          title: 'Student completed a course',
          message: `${student.name} completed ${course.title}.`,
          link: '/instructor/analytics',
        },
      ],
      sessionOpts(session)
    );
  }

  return { certificate, created: true };
}

module.exports = { recalculateEnrollment, issueCertificateIfComplete };
