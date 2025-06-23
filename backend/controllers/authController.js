const connectDb = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserHistory = require('../models/UserHistory');
const { sendVerificationEmail, sendWelcomeEmail, sendLoginNotifyEmail } = require('../utils/email');
const mongoose = require('mongoose');
const { processLocation } = require('../helper/locationHelper');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Remove the standalone mongoose.connect in migrateUsers
async function migrateUsers() {
  try {
    // Ensure connection is established
    await connectDb();
    const result = await User.updateMany(
      { linkedAccounts: { $exists: false } },
      { $set: { linkedAccounts: [] } }
    );
    console.log(`Updated ${result.modifiedCount} users`);
  } catch (err) {
    console.error("Migration error:", err);
  }
}

// Run migration only if explicitly needed (e.g., via a script or env flag)
if (process.env.RUN_MIGRATION === "true") {
  migrateUsers().finally(() => {
    // Don't disconnect here to keep the connection alive for the server
    console.log("Migration process completed");
  });
}

migrateUsers();

async function migrateVerificationAttempts() {
  try {
    await connectDb();
    const result = await User.updateMany(
      { verificationAttempts: { $exists: false } },
      { $set: { verificationAttempts: { count: 0 } } }
    );
    console.log(`Updated ${result.modifiedCount} users with verificationAttempts`);
  } catch (err) {
    console.error("Migration error:", err);
  }
}
if (process.env.RUN_MIGRATION === "true") {
  migrateVerificationAttempts().finally(() => console.log("Migration completed"));
}

// Register User
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, middleName, location } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already taken' });
    }

    // process location data
    const processedLocation = await processLocation(location, req.ip)
    if (!processedLocation.coordinates) {
    console.warn('No valid location data available, setting default location');
    processedLocation.coordinates = [];
    processedLocation.city = '';
    processedLocation.country = '';
  }

    // Create user
    const user = await User.create({
      email,
      password,
      profile: {
        firstName,
        lastName,
        middleName: middleName || '',
        location: processedLocation,
      },
      createdAt: new Date(),
    });

    // Generate username
    const username = `user_${user._id.toString().slice(0, 6)}`;
    user.username = username;

    //  Generate token and add to session
    const token = generateToken(user._id);
    user.sessions = [{
      token,
      device: req.headers['user-agent'] || 'unknown',
      ipAddress: req.ip,
      lastActive: new Date(),
      active: true,
    }]

    // Generate and send verification code
    const verificationToken = user.createVerificationToken();

    await user.save({ validateBeforeSave: false });

    console.log('Generated OTP for registration:', verificationToken, 'for email:', email); // Debug log

    try {
      await sendVerificationEmail(email, firstName, verificationToken);
      user.verificationMethod = 'email';
      await user.save({ validateBeforeSave: false });
    } catch (err) {
      console.error('Email sending error during registration:', err);
      user.verificationMethod = 'manual';
      await user.save({ validateBeforeSave: false });
    }

    // Send welcome email
    try {
      await sendWelcomeEmail(email, firstName);
    } catch (err) {
      console.error('Failed to send welcome email:', err);
    }

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        token,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Verify User
exports.verifyUser = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Verification code is required' });
    }

    console.log('Received OTP for verification:', code); // Debug log
    const user = await User.findOne({
      verificationToken: code, // Compare plain OTP
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      console.log('No user found with matching OTP or OTP expired'); // Debug log
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired code. Please request a new one.' 
      });
    }

    console.log('User verified:', user.email); // Debug log
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    user.verificationAttempts = { count: 0, lastAttempt: undefined };
    await user.save();

    res.json({ 
      success: true, 
      message: 'Account verified successfully',
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Verify user error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Check username availability
exports.checkUsername = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }

    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Username is already taken' });
    }

    res.json({ success: true, message: 'Username is available' });
  } catch (err) {
    console.error('Check username error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Resend Verification Code
exports.resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Account is already verified' });
    }

    // Check daily OTP request limit
    const today = new Date().setHours(0, 0, 0, 0);
    if (user.verificationAttempts.lastAttempt && 
        new Date(user.verificationAttempts.lastAttempt).setHours(0, 0, 0, 0) === today) {
      if (user.verificationAttempts.count >= 3) {
        return res.status(429).json({
          success: false,
          message: 'Too many verification requests today. Please try again tomorrow.',
        });
      }
      user.verificationAttempts.count += 1;
    } else {
      user.verificationAttempts.count = 1;
      user.verificationAttempts.lastAttempt = new Date();
    }

    // Generate new verification code
    const verificationToken = user.createVerificationToken();
    await user.save({ validateBeforeSave: false });
    console.log('Generated OTP for resend:', verificationToken, 'for email:', email); // Debug log

    try {
      await sendVerificationEmail(user.email, user.profile.firstName, verificationToken);
      res.json({ success: true, message: 'Verification code sent to your email' });
    } catch (err) {
      console.error('Email sending error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send verification email' 
      });
    }
  } catch (err) {
    console.error('Resend verification code error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password, location } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      // Check daily OTP request limit
      const today = new Date().setHours(0, 0, 0, 0);
      if (user.verificationAttempts.lastAttempt && new Date(user.verificationAttempts.lastAttempt).setHours(0, 0, 0, 0) === today) {
        if (user.verificationAttempts.count >= 3) {
          return res.status(429).json({
            success: false,
            message: 'Too many verification requests today. Please try again tomorrow.',
          });
        }
        user.verificationAttempts.count += 1;
      } else {
        user.verificationAttempts.count = 1;
        user.verificationAttempts.lastAttempt = new Date();
      }

      // Generate and send new verification code
      const verificationToken = user.createVerificationToken();
      await user.save({ validateBeforeSave: false });
      console.log('Generated OTP for unverified login:', verificationToken, 'for email:', email); // Debug log

      try {
        await sendVerificationEmail(user.email, user.profile.firstName, verificationToken);
        user.verificationMethod = 'email';
        await user.save({ validateBeforeSave: false });
      } catch (err) {
        console.error('Email sending error during login:', err);
        user.verificationMethod = 'manual';
        await user.save({ validateBeforeSave: false });
        return res.status(500).json({ success: false, message: 'Failed to send verification email' });
      }

      return res.status(403).json({
        success: false,
        message: 'Please verify your account. A new verification code has been sent to your email.',
      });
    }

    // Process location data with fallback
    let processedLocation;
    try {
      processedLocation = await processLocation(location, req.ip);
      if (!processedLocation || !processedLocation.coordinates) {
        console.warn('No valid location data available, setting default location');
        processedLocation = {
          city: '',
          country: '',
          coordinates: [],
        };
      }
    } catch (err) {
      console.error('Error processing location:', err);
      processedLocation = {
        city: '',
        country: '',
        coordinates: [],
      };
    }
    user.profile.location = processedLocation;
    await user.save({ validateBeforeSave: false });

    // Update last login
    const token = generateToken(user._id);
    const loginTime = new Date();
    user.sessions.push({
      token,
      device: req.headers['user-agent'] || 'unknown',
      ipAddress: req.ip,
      lastActive: loginTime,
      active: true,
    });


    user.sessions = user.sessions.filter(session => session.active && session.lastActive > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30 days

    await user.save();

    try {
      await sendLoginNotifyEmail(
        user.email,
        user.profile.firstName,
        user.profile.location.city,
        user.profile.location.country,
        req.headers['user-agent'] || 'unknown',
        req.ip,
        loginTime
      );
    } catch (error) {
      console.error('Failed to send login notification email:', err);
    }

    // Fetch all active sessions to return available accounts
    const activeSessions = user.sessions.filter(session => session.active).map(session => ({
      token: session.token,
      device: session.device,
      lastActive: session.lastActive,
    }));

    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        token,
        activeSessions, 
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "No user found with that email" });
    }

    const resetOtp = user.createPasswordResetOtp();
    await user.save({ validateBeforeSave: false });

    try {
      await sendVerificationEmail(user.email, user.profile.firstName, resetOtp);
      res.json({
        success: true,
        message: "Password reset OTP sent to your email",
      });
    } catch (err) {
      user.passwordResetOtp = undefined;
      user.passwordResetOtpExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: "Error sending OTP email" });
    }
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Verify Reset OTP
exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const user = await User.findOne({
      email,
      passwordResetOtp: code,
      passwordResetOtpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    res.json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      passwordResetOtp: token,
      passwordResetOtpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    user.password = password;
    user.passwordResetOtp = undefined;
    user.passwordResetOtpExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully",
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      },
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Subscribe to Premium Plan
exports.subscribe = async (req, res) => {
  try {
    const { plan } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!['Premium', 'Elite'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid subscription plan' });
    }

    // TODO: Integrate with payment gateway (e.g., Stripe)
    const paymentSuccessful = true;

    if (!paymentSuccessful) {
      return res.status(400).json({ success: false, message: 'Payment processing failed' });
    }

    // Update subscription
    user.subscription.plan = plan;
    user.subscription.status = 'active';
    user.subscription.expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await user.save();

    // Log subscription change
    await UserHistory.create({
      userId: user._id,
      field: 'subscription.plan',
      oldValue: 'Basic',
      newValue: plan,
      ipAddress: req.ip,
      device: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      message: `Successfully subscribed to ${plan} plan`,
      data: {
        plan: user.subscription.plan,
        status: user.subscription.status,
        expiryDate: user.subscription.expiryDate,
        features: user.subscription.features,
      },
    });
  } catch (err) {
    console.error('Subscription error:', err);
    res.status(500).json({ success: false, message: 'Failed to process subscription' });
  }
};

// :Get Linked accounts 
exports.getLinkedAccounts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('linkedAccounts', 'username email profile.avatar');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: user.linkedAccounts,
    });
  } catch (err) {
    console.error('Get linked accounts error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Link account
exports.linkAccount = async (req, res) => {
  try {
    const { email, password } = req.body;
    const primaryUser = await User.findById(req.user._id);

    if (!primaryUser) {
      return res.status(404).json({ success: false, message: 'Primary user not found' });
    }

    const secondaryUser = await User.findOne({ email }).select('+password');
    if (!secondaryUser || !(await secondaryUser.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (primaryUser._id.equals(secondaryUser._id)) {
      return res.status(400).json({ success: false, message: 'Cannot link the same account' });
    }

    if (primaryUser.linkedAccounts.includes(secondaryUser._id)) {
      return res.status(400).json({ success: false, message: 'Account already linked' });
    }

    primaryUser.linkedAccounts.push(secondaryUser._id);
    await primaryUser.save();

    const token = generateToken(secondaryUser._id);
    secondaryUser.sessions.push({
      token,
      device: req.headers['user-agent'] || 'unknown',
      ipAddress: req.ip,
      lastActive: new Date(),
    });
    await secondaryUser.save();

    res.json({
      success: true,
      data: {
        _id: secondaryUser._id,
        username: secondaryUser.username,
        email: secondaryUser.email,
        token,
      },
    });
  } catch (err) {
    console.error('Link account error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Switch account
exports.switchAccount = async (req, res) => {
  try {
    const { accountId } = req.body;
    const primaryUser = await User.findById(req.user._id);

    if (!primaryUser) {
      return res.status(404).json({ success: false, message: 'Primary user not found' });
    }

    // Ensure linkedAccounts is an array
    if (!Array.isArray(primaryUser.linkedAccounts) || !primaryUser.linkedAccounts.includes(accountId)) {
      return res.status(403).json({ success: false, message: 'Account not linked' });
    }

    const secondaryUser = await User.findById(accountId);
    if (!secondaryUser) {
      return res.status(404).json({ success: false, message: 'Target account not found' });
    }

    const token = generateToken(secondaryUser._id);
    secondaryUser.sessions.push({
      token,
      device: req.headers['user-agent'] || 'unknown',
      ipAddress: req.ip,
      lastActive: new Date(),
    });
    await secondaryUser.save();

    res.json({
      success: true,
      data: {
        _id: secondaryUser._id,
        username: secondaryUser.username,
        email: secondaryUser.email,
        token,
      },
    });
  } catch (err) {
    console.error('Switch account error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Invalidate only the current session
    const token = req.headers.authorization?.split(' ')[1];
    user.sessions = user.sessions.map(session => {
      if (session.token === token) {
        return { ...session, active: false };
      }
      return session;
    });
    await user.save();

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

