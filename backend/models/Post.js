const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  content: {
    type: String,
    trim: true,
    maxlength: 2000,
  },
  media: [
    {
      url: { type: String, trim: true },
      type: { type: String, enum: ['image', 'video', 'audio', 'file'], default: 'image' },
    }
  ],
  likes: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }
  ],
  comments: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      text: { type: String, trim: true, maxlength: 500 },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  tags: [{ type: String, trim: true }],
  location: {
    city: String,
    country: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere',
    }
  },
  privacy: {
    type: String,
    enum: ['public', 'followers', 'private'],
    default: 'public',
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

// Ensure likes are unique
postSchema.index({ userId: 1, 'likes': 1 });

// Auto-update updatedAt on save
postSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Post', postSchema);
