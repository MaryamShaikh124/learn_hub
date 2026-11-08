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

test('paid courses cannot be enrolled without a payment provider', async () => {
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
    .expect(404);
});
