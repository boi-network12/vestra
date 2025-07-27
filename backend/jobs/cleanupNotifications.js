
const cron = require('node-cron');
const Notification = require('../models/Notification');

cron.schedule('0 0 * * *', async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await Notification.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
    console.log('Old notifications cleaned up');
  } catch (err) {
    console.error('Notification cleanup error:', err);
  }
});