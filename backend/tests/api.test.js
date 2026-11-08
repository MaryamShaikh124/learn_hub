process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-that-is-never-used-outside-tests';

const { after, before, beforeEach, test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Payment = require('../models/Payment');
const { removeLegacyRelationshipUniqueIndexes } = require('../utils/checkoutIndexMigration');

let mongo;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

beforeEach(async () => {
  await Promise.all(Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})));
});

after(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test('health endpoint reports an active database connection', async () => {
  const response = await request(app).get('/api/health').expect(200);
  assert.equal(response.body.data.database, 'connected');
});

test('public registration creates a student and authenticates the new account', async () => {
  const registration = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Taylor Learner',
      email: 'TAYLOR@example.com',
      password: 'a-secure-password',
      confirmPassword: 'a-secure-password',
      role: 'admin',
    })
    .expect(201);

  assert.equal(registration.body.data.user.role, 'student');
  assert.equal(registration.body.data.user.email, 'taylor@example.com');
  assert.ok(registration.body.data.token);

  const me = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${registration.body.data.token}`)
    .expect(200);
  assert.equal(me.body.data.user.name, 'Taylor Learner');
});

test('registration rejects mismatched confirmation passwords', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Taylor Learner',
      email: 'taylor@example.com',
      password: 'a-secure-password',
      confirmPassword: 'a-different-password',
    })
    .expect(400);

  assert.match(response.body.message, /Passwords do not match/i);
});

test('login rejects an incorrect password', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Taylor Learner',
      email: 'taylor@example.com',
      password: 'a-secure-password',
      confirmPassword: 'a-secure-password',
    })
    .expect(201);

  await request(app)
    .post('/api/auth/login')
    .send({ email: 'taylor@example.com', password: 'wrong-password' })
    .expect(401);
});

test('private enrollment and course management endpoints require authentication', async () => {
  await request(app).get('/api/enrollments/me').expect(401);
  await request(app).post('/api/courses').send({}).expect(401);
});

test('public course listing returns the expected empty catalog shape', async () => {
  const response = await request(app).get('/api/courses').expect(200);
  assert.deepEqual(response.body.data.courses, []);
  assert.equal(response.body.data.total, 0);
  assert.equal(response.body.data.page, 1);
});

test('admins can create courses for active instructors and cannot assign other roles', async () => {
  const admin = await User.create({
    name: 'Course Admin',
    email: 'course.admin@example.test',
    password: 'a-secure-password',
    role: 'admin',
  });
  const instructor = await User.create({
    name: 'Course Instructor',
    email: 'assigned.instructor@example.test',
    password: 'a-secure-password',
    role: 'instructor',
  });
  const student = await User.create({
    name: 'Course Student',
    email: 'course.student@example.test',
    password: 'a-secure-password',
  });
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: admin.email, password: 'a-secure-password' })
    .expect(200);
  const token = login.body.data.token;
  const courseDetails = {
    title: 'Admin Created Course',
    shortDescription: 'A practical course created by an administrator.',
    description: 'Learn useful skills in this course through practical examples and guided exercises.',
    category: 'Development',
    level: 'Beginner',
    price: 0,
    instructorId: instructor.id,
  };

  const response = await request(app)
    .post('/api/courses')
    .set('Authorization', `Bearer ${token}`)
    .send(courseDetails)
    .expect(201);
  assert.equal(response.body.data.course.instructor.id, String(instructor._id));
  assert.equal(await Course.countDocuments({ instructor: instructor._id }), 1);

  await request(app)
    .post('/api/courses')
    .set('Authorization', `Bearer ${token}`)
    .send({ ...courseDetails, title: 'Invalid Instructor Course', instructorId: student.id })
    .expect(400);

  await request(app)
    .post('/api/courses')
    .set('Authorization', `Bearer ${token}`)
    .send({ ...courseDetails, title: 'Malformed Instructor Course', instructorId: 'not-an-id' })
    .expect(400);
});

test('free enrollment tracks lesson completion and issues a certificate', async () => {
  const registration = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Course Learner',
      email: 'course.learner@example.test',
      password: 'a-secure-password',
      confirmPassword: 'a-secure-password',
    })
    .expect(201);
  const token = registration.body.data.token;

  const instructor = await User.create({
    name: 'Course Instructor',
    email: 'instructor@example.test',
    password: 'a-secure-password',
    role: 'instructor',
  });
  const course = await Course.create({
    title: 'Practical Web Design',
    slug: 'practical-web-design',
    shortDescription: 'Build a practical foundation in web design.',
    description: 'Learn the fundamentals of practical web design through a focused hands-on lesson.',
    category: 'Design',
    level: 'Beginner',
    price: 0,
    instructor: instructor._id,
    published: true,
  });
  const lesson = await Lesson.create({
    course: course._id,
    title: 'Start with strong foundations',
    description: 'Learn the core principles.',
    videoUrl: 'https://example.com/lesson',
    order: 1,
  });

  await request(app)
    .get(`/api/enrollments/learn/${course._id}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(403);
  await request(app)
    .post(`/api/enrollments/free/${course._id}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(201);

  const completion = await request(app)
    .post(`/api/enrollments/${course._id}/lessons/${lesson._id}/complete`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  assert.equal(completion.body.data.progress, 100);
  assert.equal(completion.body.data.status, 'completed');
  assert.ok(completion.body.data.certificateId);

  const certificates = await request(app)
    .get('/api/certificates/me')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  assert.equal(certificates.body.data.certificates.length, 1);
  assert.equal(certificates.body.data.certificates[0].course.title, course.title);
});

test('paid courses can be joined with an explicitly simulated checkout', async () => {
  const registration = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Paid Course Learner',
      email: 'paid.course.learner@example.test',
      password: 'a-secure-password',
      confirmPassword: 'a-secure-password',
    })
    .expect(201);
  const instructor = await User.create({
    name: 'Paid Course Instructor',
    email: 'paid.instructor@example.test',
    password: 'a-secure-password',
    role: 'instructor',
  });
  const course = await Course.create({
    title: 'Advanced Product Design',
    slug: 'advanced-product-design',
    shortDescription: 'Explore advanced product design techniques.',
    description: 'Study advanced product design techniques through practical exercises and examples.',
    category: 'Design',
    level: 'Advanced',
    price: 2500,
    instructor: instructor._id,
    published: true,
  });

  await request(app)
    .post(`/api/enrollments/free/${course._id}`)
    .set('Authorization', `Bearer ${registration.body.data.token}`)
    .expect(402);
  await request(app)
    .post(`/api/payments/checkout/${course._id}`)
    .set('Authorization', `Bearer ${registration.body.data.token}`)
    .expect(201);
});

test('simulated checkout saves payment history and grants course access', async () => {
  const learner = await User.create({
    name: 'Checkout Learner',
    email: 'checkout.learner@example.test',
    password: 'a-secure-password',
    role: 'student',
  });
  const admin = await User.create({
    name: 'Checkout Admin',
    email: 'checkout.admin@example.test',
    password: 'a-secure-password',
    role: 'admin',
  });
  const instructor = await User.create({
    name: 'Checkout Instructor',
    email: 'checkout.instructor@example.test',
    password: 'a-secure-password',
    role: 'instructor',
  });
  const course = await Course.create({
    title: 'Checkout Experience Design',
    slug: 'checkout-experience-design',
    shortDescription: 'Build clear and thoughtful checkout experiences.',
    description: 'Learn how to plan and evaluate a checkout experience with practical examples.',
    category: 'Design',
    level: 'Intermediate',
    price: 1800,
    instructor: instructor._id,
    published: true,
  });

  await Promise.all([Payment.init(), mongoose.model('Enrollment').init()]);
  for (const model of [Payment, mongoose.model('Enrollment')]) {
    const indexes = await model.collection.indexes();
    const courseIndex = indexes.find((index) => {
      const keys = Object.keys(index.key);
      return keys.length === 1 && index.key.course === 1;
    });
    const studentIndex = indexes.find((index) => {
      const keys = Object.keys(index.key);
      return keys.length === 1 && index.key.student === 1;
    });
    if (courseIndex) await model.collection.dropIndex(courseIndex.name);
    if (studentIndex) await model.collection.dropIndex(studentIndex.name);
    await model.collection.createIndex({ course: 1 }, { unique: true, name: 'legacy_course_unique' });
    await model.collection.createIndex({ student: 1 }, { unique: true, name: 'legacy_student_unique' });
  }
  await Payment.collection.createIndex({ orderId: 1 }, { unique: true, name: 'orderId_1' });
  await removeLegacyRelationshipUniqueIndexes();
  assert.equal(
    (await Payment.collection.indexes()).some((index) => index.name === 'orderId_1'),
    false
  );

  const learnerLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: learner.email, password: 'a-secure-password' })
    .expect(200);
  const learnerToken = learnerLogin.body.data.token;

  const checkout = await request(app)
    .post(`/api/payments/checkout/${course._id}`)
    .set('Authorization', `Bearer ${learnerToken}`)
    .expect(201);
  assert.equal(checkout.body.data.simulated, true);
  assert.equal(checkout.body.data.payment.status, 'simulated');
  assert.equal(checkout.body.data.payment.method, 'demo');
  assert.equal(checkout.body.data.payment.amount, 1800);
  assert.match(checkout.body.data.notice, /No real payment was collected/i);
  assert.equal(await Payment.countDocuments({ student: learner._id, course: course._id }), 1);
  assert.equal(await mongoose.model('Enrollment').countDocuments({ student: learner._id, course: course._id }), 1);

  const secondLearner = await User.create({
    name: 'Second Checkout Learner',
    email: 'checkout.second-learner@example.test',
    password: 'a-secure-password',
    role: 'student',
  });
  const secondLearnerLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: secondLearner.email, password: 'a-secure-password' })
    .expect(200);
  await request(app)
    .post(`/api/payments/checkout/${course._id}`)
    .set('Authorization', `Bearer ${secondLearnerLogin.body.data.token}`)
    .expect(201);
  assert.equal(await Payment.countDocuments({ course: course._id }), 2);
  assert.equal(await mongoose.model('Enrollment').countDocuments({ course: course._id }), 2);

  const secondCourse = await Course.create({
    title: 'Checkout Product Strategy',
    slug: 'checkout-product-strategy',
    shortDescription: 'Plan effective product strategies.',
    description: 'Learn practical techniques for planning product strategies.',
    category: 'Business',
    level: 'Intermediate',
    price: 1200,
    instructor: instructor._id,
    published: true,
  });
  await request(app)
    .post(`/api/payments/checkout/${secondCourse._id}`)
    .set('Authorization', `Bearer ${learnerToken}`)
    .expect(201);
  assert.equal(await Payment.countDocuments({ student: learner._id }), 2);
  assert.equal(await mongoose.model('Enrollment').countDocuments({ student: learner._id }), 2);
  assert.equal(await Payment.countDocuments(), 3);
  assert.equal(await mongoose.model('Enrollment').countDocuments(), 3);

  const learnerHistory = await request(app)
    .get('/api/payments/me')
    .set('Authorization', `Bearer ${learnerToken}`)
    .expect(200);
  assert.equal(learnerHistory.body.data.payments.length, 2);
  assert.deepEqual(
    learnerHistory.body.data.payments.map((payment) => payment.course.title).sort(),
    [course.title, secondCourse.title].sort()
  );

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: admin.email, password: 'a-secure-password' })
    .expect(200);
  const adminHistory = await request(app)
    .get('/api/admin/payments')
    .set('Authorization', `Bearer ${adminLogin.body.data.token}`)
    .expect(200);
  assert.equal(adminHistory.body.data.payments.length, 3);
  assert.equal(adminHistory.body.data.realRevenue, 0);

  await request(app)
    .post(`/api/payments/checkout/${course._id}`)
    .set('Authorization', `Bearer ${learnerToken}`)
    .expect(409);
});
