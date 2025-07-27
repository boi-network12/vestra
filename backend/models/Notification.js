const mongoose = require('mongoose');
const { type } = require('os');

const notificationSchema = new mongoose.Schema({
   userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Notification must belong to a user'],
    index: true
   },
   type: {
    type: String,
    enum:[
        'like',
        'comment',
        'follow',
        'mention',
        'system',
        'account_change',
        'subscription_update',
    ],
    required: [true, 'Notification type is required']
   },
   message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true
   },
   read: {
    type: Boolean,
    default: false
   },
   relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'relatedModel'
   },
   relatedModel: {
    type: String,
    enum: ['User', 'Post', null]
   },
   createdAt: {
    type: Date,
    default: Date.now
   }
}, {
    timestamps: true,
});

// Virtual for formatted createdAt date
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);