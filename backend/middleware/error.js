const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400));
  }
  return next();
}

function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong.';

  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier.';
  }
  if (err.code === 11000) {
    status = 409;
    message = 'That record already exists.';
  }
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors)[0]?.message || 'Invalid data.';
  }

  if (status >= 500) console.error(err);

  res.status(status).json({ success: false, message });
}

function notFound(req, res) {
  res.status(404).json({ success: false, message: 'Route not found.' });
}

module.exports = { validate, errorHandler, notFound };
