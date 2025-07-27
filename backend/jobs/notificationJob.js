const Queue = require('bull');
const { createNotification } = require('../controllers/notificationController');

// Initialize Redis-based queue
const notificationQueue = new Queue('notification-queue', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
  },
});

// Process notification jobs
notificationQueue.process(async (job) => {
  const { userId, type, message, relatedId, relatedModel } = job.data;
  try {
    await createNotification({ userId, type, message, relatedId, relatedModel });
    console.log(`Processed notification for user ${userId}: ${type}`);
  } catch (err) {
    console.error('Notification job error:', err);
    throw err;
  }
});

// Add notification to queue
exports.addNotificationToQueue = async (data) => {
  await notificationQueue.add(data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  });
};