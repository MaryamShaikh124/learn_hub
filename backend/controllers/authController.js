const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../utils/tokens');

function authPayload(user) {
  return {
    user: user.toSafeObject(),
    token: signToken(user),
  };
}

const register = asyncHandler(async (req, res) => {
  const existing = await User.findOne({ email: req.body.email });
  if (existing) throw new AppError('An account with this email already exists.', 409);

  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: 'student',
  });
  const withVersion = await User.findById(user._id).select('+tokenVersion');
  res.status(201).json({ success: true, data: authPayload(withVersion) });
});

const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+password +tokenVersion');
  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new AppError('Email or password is incorrect.', 401);
  }
  if (!user.isActive) throw new AppError('This account has been deactivated.', 403);
  res.json({ success: true, data: authPayload(user) });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toSafeObject() } });
});

const updateProfile = asyncHandler(async (req, res) => {
  req.user.name = req.body.name;
  req.user.headline = req.body.headline || '';
  req.user.bio = req.body.bio || '';
  await req.user.save();
  res.json({ success: true, data: { user: req.user.toSafeObject() } });
});

const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password +tokenVersion');
  const matches = await user.comparePassword(req.body.currentPassword);
  if (!matches) throw new AppError('Current password is incorrect.', 400);
  user.password = req.body.newPassword;
  user.tokenVersion += 1;
  await user.save();
  res.json({ success: true, data: authPayload(user), message: 'Password updated. Other sessions have been signed out.' });
});

module.exports = { register, login, me, updateProfile, changePassword };
