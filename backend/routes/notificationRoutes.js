const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getNotifications, markAsRead, deleteNotification, updateNotificationSettings } = require('../controllers/notificationController');
const router = express.Router();


router.use(protect);

router.get('/', getNotifications);
router.patch('/:notificationId/read', markAsRead);
router.patch('/read-all', markAsRead);
router.delete('/:notificationId', deleteNotification);
router.patch('/settings', updateNotificationSettings);

module.exports = router;