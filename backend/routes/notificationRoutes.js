const express = require('express');
const { protect } = require('../middleware/auth');
const notifications = require('../controllers/notificationController');

const router = express.Router();

router.get('/', protect, notifications.listNotifications);
router.put('/read-all', protect, notifications.markAllRead);
router.put('/:id/read', protect, notifications.markRead);

module.exports = router;
