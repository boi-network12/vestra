const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { RateLimiterMemory } = require('rate-limiter-flexible');

const authLimiter = new RateLimiterMemory({
  points: 10, // 10 attempts
  duration: 3600, // per hour per IP
});

exports.protect = async (req, res, next) => {
  try {
    // Rate limit check
    await authLimiter.consume(req.ip);

    // Get token from header or cookies
    let token;
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user exists
    let currentUser = await User.findById(decoded.id).select('+sessions');
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'User associated with this token no longer exists',
      });
    }

    // Ensure linkedAccounts is initialized
    if (!Array.isArray(currentUser.linkedAccounts)) {
      currentUser.linkedAccounts = [];
      await currentUser.save({ validateBeforeSave: false });
      // Reload user to ensure consistency
      currentUser = await User.findById(decoded.id).select('+sessions');
      if (!currentUser) {
        return res.status(500).json({
          success: false,
          message: 'Failed to reload user after initialization',
        });
      }
    }

    // Check if session is valid
    const session = currentUser.sessions.find(
      (s) => s.token === token && s.active
    );
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session. Please log in again',
      });
    }

    // Check password change
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'Password changed recently. Please log in again',
      });
    }

    // Attach user to request
    req.user = currentUser;
    next();
  } catch (err) {
    console.error('Authentication Error:', {
      message: err.message || 'Unknown error',
      stack: err.stack,
      path: req.path,
      method: req.method,
    });

    let message = 'Not authorized to access this route';
    let status = 401;

    if (err.name === 'TokenExpiredError') {
      message = 'Token expired. Please log in again';
    } else if (err.name === 'JsonWebTokenError') {
      message = 'Invalid token. Please log in again';
    } else if (err.msBeforeNext) {
      message = 'Too many authentication attempts. Try again later';
      status = 429;
    } else {
      // Handle unexpected errors
      message = process.env.NODE_ENV === 'development' ? err.message : 'Authentication failed due to server error';
      status = 500;
    }

    res.status(status).json({
      success: false,
      message,
    });
  }
};

// Role-based authorization
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!Array.isArray(roles)) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: Invalid roles specified',
      });
    }
    if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
      });
    }
    next();
  };
};