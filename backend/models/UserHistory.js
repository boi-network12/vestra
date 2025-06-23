const mongoose = require('mongoose');

const userHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  field: {
    type: String,
    required: true, // e.g., 'email', 'subscription.plan'
  },
  oldValue: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  changedAt: {
    type: Date,
    default: Date.now,
  },
  ipAddress: {
    type: String,
  },
  device: {
    type: String,
  },
});

module.exports = mongoose.model('UserHistory', userHistorySchema);