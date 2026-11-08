const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AppError('Please log in to continue.', 401);

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError('Your session has expired. Please log in again.', 401);
  }

  const user = await User.findById(decoded.id).select('+tokenVersion');
  if (!user || !user.isActive) throw new AppError('This account is not available.', 401);
  if (user.tokenVersion !== decoded.tokenVersion) {
    throw new AppError('Your session is no longer valid. Please log in again.', 401);
  }

  req.user = user;
  next();
});

const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+tokenVersion');
    if (user && user.isActive && user.tokenVersion === decoded.tokenVersion) req.user = user;
  } catch {
    // Public pages still render when a stored token is stale.
  }
  next();
});

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to do that.', 403));
  }
  return next();
};

module.exports = { protect, authorize, optionalAuth };
