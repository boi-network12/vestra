const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    trim: true,
    sparse: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^\+?[\d\s\-()]{7,15}$/, 'Please provide a valid phone number'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  profile: {
    firstName: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },
    bio: { type: String, maxlength: 500, trim: true, default: '' },
    links: [{
      title: { type: String, trim: true, default: '' },
      url: { type: String, trim: true, default: '' },
    }],
    avatar: { type: String, default: '' },
    coverPhoto: { type: String, default: '' },
    location: {
      city: String,
      country: String,
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere',
      },
    },
    culturalBackground: {
      type: String,
      enum: ['African', 'African-American', 'Caribbean', 'Other', 'Prefer not to say'],
      default: 'Prefer not to say',
    },
    interests: [{ type: String, trim: true }],
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
      default: 'Prefer not to say', 
    },
  },
  subscription: {
    plan: {
      type: String,
      enum: ['Basic', 'Premium', 'Elite'],
      default: 'Basic',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired'],
      default: 'inactive',
    },
    expiryDate: Date,
    features: {
      blueTick: { type: Boolean, default: false },
      dailyPostLimit: { type: Number, default: 10 },
      analyticsAccess: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
    },
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationMethod: {
    type: String,
    enum: ['email', 'manual'],
    default: 'email',
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  sessions: [{
    token: { type: String, required: true },
    device: { type: String, default: 'unknown' },
    ipAddress: { type: String },
    lastActive: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
  }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  privacySettings: {
    profileVisibility: {
      type: String,
      enum: ['public', 'followers', 'private'],
      default: 'public',
    },
    showLocation: { type: Boolean, default: false },
    showEmail: { type: Boolean, default: false },
  },
  notificationSettings: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    mentions: { type: Boolean, default: true },
    follows: { type: Boolean, default: true },
  },
  isDelete: {
    type: Boolean,
    default: false,
  },
  deleteAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

userSchema.add({
  linkedAccounts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: [], 
  }],
});

userSchema.add({
  verificationAttempts: {
    count: { type: Number, default: 0 },
    lastAttempt: { type: Date },
  },
});

userSchema.add({
  passwordResetOtp: String,
  passwordResetOtpExpires: Date,
});

// Exclude deleted users from queries
userSchema.pre(/^find/, function (next) {
  this.find({ isDelete: { $ne: true } });
  next();
})

// Password hashing
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Exclude deleted users in populate queries
userSchema.pre('findOneAndUpdate', function (next) {
  this.find({ isDelete: { $ne: true } });
  next();
});

// Update passwordChangedAt
userSchema.pre('save', function (next) {
  if (this.isModified('password') && !this.isNew) {
    this.passwordChangedAt = Date.now() - 1000;
  }
  next();
});

// Add to userSchema.pre('save')
userSchema.pre('save', function (next) {
  if (!this.sessions) {
    this.sessions = [];
  }
  if (!this.linkedAccounts) {
    this.linkedAccounts = [];
  }
  next();
});

// Update subscription features based on plan
userSchema.pre('save', function (next) {
  if (this.isModified('subscription.plan')) {
    switch (this.subscription.plan) {
      case 'Premium':
        this.subscription.features = {
          blueTick: true,
          dailyPostLimit: 50,
          analyticsAccess: true,
          prioritySupport: false,
        };
        break;
      case 'Elite':
        this.subscription.features = {
          blueTick: true,
          dailyPostLimit: Infinity,
          analyticsAccess: true,
          prioritySupport: true,
        };
        break;
      default:
        this.subscription.features = {
          blueTick: false,
          dailyPostLimit: 10,
          analyticsAccess: false,
          prioritySupport: false,
        };
    }
  }
  next();
});

// Check if password was changed after token issuance
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Create password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};


// Create verification token
userSchema.methods.createVerificationToken = function () {
  const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationToken = verificationToken; // Store plain OTP
  this.verificationTokenExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
  return verificationToken;
};

userSchema.methods.createPasswordResetOtp = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  this.passwordResetOtp = otp;
  this.passwordResetOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return otp;
};

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);