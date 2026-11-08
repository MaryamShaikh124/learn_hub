const crypto = require('node:crypto');
const Payment = require('../models/Payment');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { withTransaction, sessionOpts } = require('../utils/transaction');
const { enrollStudent } = require('./enrollmentController');

function presentPayment(payment) {
  return {
    id: payment._id,
    reference: payment.reference,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    method: payment.method,
    simulated: true,
    createdAt: payment.createdAt,
    course: payment.course?.title
      ? { id: payment.course._id, title: payment.course.title }
      : payment.course,
    student: payment.student?.name
      ? { id: payment.student._id, name: payment.student.name, email: payment.student.email }
      : payment.student,
  };
}

const simulateCheckout = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course || !course.published) throw new AppError('Course not found.', 404);
  if (course.price <= 0) throw new AppError('This course is free. Use free enrollment instead.', 400);
  if (String(course.instructor) === String(req.user._id)) {
    throw new AppError('You cannot purchase your own course.', 400);
  }

  const reference = `DEMO-${crypto.randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()}`;
  const result = await withTransaction(async (session) => {
    const options = sessionOpts(session);
    const existing = await Enrollment.findOne({ student: req.user._id, course: course._id }).setOptions(options);
    if (existing) throw new AppError('You are already enrolled in this course.', 409);

    const [payment] = await Payment.create(
      [{
        student: req.user._id,
        course: course._id,
        reference,
        amount: course.price,
        currency: 'PKR',
        status: 'simulated',
        method: 'demo',
      }],
      options
    );
    const { enrollment } = await enrollStudent({ studentId: req.user._id, course, session });
    return { payment, enrollment };
  });

  res.status(201).json({
    success: true,
    data: {
      payment: presentPayment(result.payment),
      enrollmentId: result.enrollment._id,
      simulated: true,
      notice: 'Demo checkout only. No real payment was collected.',
    },
  });
});

const myPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ student: req.user._id })
    .populate('course', 'title')
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({ success: true, data: { payments: payments.map(presentPayment) } });
});

const listPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find()
    .populate('student', 'name email')
    .populate('course', 'title')
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({
    success: true,
    data: {
      payments: payments.map(presentPayment),
      simulatedOnly: true,
      realRevenue: 0,
    },
  });
});

module.exports = { simulateCheckout, myPayments, listPayments };
