const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(40);
  const unread = await Notification.countDocuments({ recipient: req.user._id, read: false });
  res.json({
    success: true,
    data: {
      unread,
      notifications: notifications.map((item) => ({
        id: item._id,
        title: item.title,
        message: item.message,
        type: item.type,
        link: item.link,
        read: item.read,
        createdAt: item.createdAt,
      })),
    },
  });
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user._id });
  if (!notification) throw new AppError('Notification not found.', 404);
  notification.read = true;
  await notification.save();
  res.json({ success: true });
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  res.json({ success: true });
});

module.exports = { listNotifications, markRead, markAllRead };
