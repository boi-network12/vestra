const async = require('async');
const { createNotification } = require('../controllers/notificationController');

// Initialize in-memory queue
const notificationQueue = async.queue(async (data, callback) => {
  const { userId, type, message, relatedId, relatedModel } = data;
  try {
    await createNotification({ userId, type, message, relatedId, relatedModel });
    console.log(`Processed notification for user ${userId}: ${type}`);
    callback();
  } catch (err) {
    console.error('Notification job error:', err);
    callback(err);
  }
}, 10); // Process up to 10 notifications concurrently

// Add notification to queue
exports.addNotificationToQueue = async (data) => {
  try {
    await new Promise((resolve, reject) => {
      notificationQueue.push(data, (err) => {
        if (err) {
          console.error('Failed to process notification:', {
            userId: data.userId,
            type: data.type,
            error: err.message,
          });
          reject(err);
        } else {
          console.log(`Queued notification for user ${data.userId}: ${data.type}`);
          resolve();
        }
      });
    });
  } catch (err) {
    console.error('Failed to add notification to queue:', {
      userId: data.userId,
      type: data.type,
      error: err.message,
    });
    throw err; // Let the caller handle the error
  }
};