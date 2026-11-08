const { body, param } = require('express-validator');
const { CATEGORIES, LEVELS } = require('../utils/constants');

const registerRules = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.'),
  body('email').isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
  body('password').isLength({ min: 8, max: 72 }).withMessage('Password must be at least 8 characters.'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match.'),
];

const loginRules = [
  body('email').isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

const profileRules = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.'),
  body('headline').optional({ values: 'falsy' }).isLength({ max: 120 }).withMessage('Headline is too long.'),
  body('bio').optional({ values: 'falsy' }).isLength({ max: 500 }).withMessage('Bio is too long.'),
];

const passwordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword').isLength({ min: 8, max: 72 }).withMessage('New password must be at least 8 characters.'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match.'),
];

const courseRules = [
  body('instructorId').optional().isMongoId().withMessage('Choose a valid instructor.'),
  body('title').trim().isLength({ min: 4, max: 140 }).withMessage('Title must be between 4 and 140 characters.'),
  body('shortDescription').trim().isLength({ min: 10, max: 180 }).withMessage('Short description must be between 10 and 180 characters.'),
  body('description').trim().isLength({ min: 20, max: 5000 }).withMessage('Description must be at least 20 characters.'),
  body('category').isIn(CATEGORIES).withMessage('Choose a valid category.'),
  body('level').isIn(LEVELS).withMessage('Choose a valid level.'),
  body('price').isFloat({ min: 0, max: 1000000 }).withMessage('Price must be a valid PKR amount.'),
  body('language').optional({ values: 'falsy' }).isLength({ max: 40 }),
  body('thumbnail').optional({ values: 'falsy' }).isURL().withMessage('Thumbnail must be a valid URL.'),
  body('published').optional().isBoolean().withMessage('Published must be true or false.'),
];

const lessonRules = [
  body('title').trim().isLength({ min: 2, max: 160 }).withMessage('Lesson title is required.'),
  body('description').optional({ values: 'falsy' }).isLength({ max: 4000 }),
  body('videoUrl').trim().isURL().withMessage('Video URL must be a valid URL.'),
  body('order').optional().isInt({ min: 1 }).withMessage('Order must be a positive number.'),
  body('durationMinutes').optional().isInt({ min: 0, max: 600 }),
];

const reviewRules = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5.'),
  body('comment').trim().isLength({ min: 4, max: 1000 }).withMessage('Comment must be between 4 and 1000 characters.'),
];

const instructorRules = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.'),
  body('email').isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
  body('password').isLength({ min: 8, max: 72 }).withMessage('Password must be at least 8 characters.'),
];

const idParam = param('id').isMongoId().withMessage('Invalid identifier.');

module.exports = {
  registerRules,
  loginRules,
  profileRules,
  passwordRules,
  courseRules,
  lessonRules,
  reviewRules,
  instructorRules,
  idParam,
};
