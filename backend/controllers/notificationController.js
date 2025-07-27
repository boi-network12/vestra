const Notification = require("../models/Notification");
const User = require("../models/User");
const UserHistory = require("../models/UserHistory");
const { sendPushNotification, sendEmailNotification } = require("../utils/email");



exports.createNotification = async ({ userId, type, message, relatedId, relatedModel }) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('user not found');
        }

        const notification = await Notification.create({
            userId,
            type,
            message,
            relatedId,
            relatedModel
        });

        // send notification based on user settings'
        if (user.notificationSettings.pushNotifications && type !== "system") {
            await sendPushNotification(user, notification);
        }
        if (user.notificationSettings.emailNotifications){
            await sendEmailNotification(user, notification)
        }

        return notification;
    } catch (error) {
        console.error(`Error creating notification for user ${userId}:`, error);
        throw new Error('Notification creation failed');
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, read} = req.query;
        const query = { userId: req.user._id};

        if (read !== undefined) {
            query.read = read === 'true';
        }

        const notifications = await Notification.find(query)
            .populate('relatedId', '-password')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments(query);

        res.json({
            success: true,
            data: notifications,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error(`Error fetching notifications for user ${req.user._id}:`, error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
        });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const notification = await Notification.findOne({
            _id: notificationId,
            userId: req.user._id
        });

        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        notification.read = true;
        await notification.save();

        res.json({ success: true, data: notification, message: "Notification marked as read" });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update notification settings
exports.updateNotificationSettings = async (req, res) => {
  try {
    const { emailNotifications, pushNotifications, mentions, follows } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update notification settings
    user.notificationSettings = {
      emailNotifications: emailNotifications ?? user.notificationSettings.emailNotifications,
      pushNotifications: pushNotifications ?? user.notificationSettings.pushNotifications,
      mentions: mentions ?? user.notificationSettings.mentions,
      follows: follows ?? user.notificationSettings.follows,
    };

    await user.save();

    // Log changes to UserHistory
    await UserHistory.create({
      userId: user._id,
      field: 'notificationSettings',
      oldValue: JSON.stringify(req.user.notificationSettings),
      newValue: JSON.stringify(user.notificationSettings),
      ipAddress: req.ip,
      device: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      data: user.notificationSettings,
      message: 'Notification settings updated successfully',
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};