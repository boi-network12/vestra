const mongoose = require("mongoose");
const { calculateRelevanceScore } = require("../helper/suggestionRelevanceScore");
const User = require("../models/User")
const UserHistory = require('../models/UserHistory');
const Notification = require('../models/Notification');
const { addNotificationToQueue } = require("../jobs/notificationJob");
const { RateLimiterMemory } = require("rate-limiter-flexible");

const followLimiter = new RateLimiterMemory({
  points: 50,
  duration: 3600
})

// get suggested users (instagram like algorithm)
exports.getSuggestedUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const currentUser = await User.findById(req.user._id).select(
      'following followers blockedUsers profile.interests profile.location profile.culturalBackground'
    );

    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Fetch all users who are not deleted, not the current user, not followed, and not blocked
    const users = await User.find({
      _id: { $ne: currentUser._id },
      isDelete: { $ne: true },
      blockedUsers: { $ne: currentUser._id }, // Exclude users who blocked the current user
      $nor: [
        { _id: { $in: currentUser.following } }, 
        { _id: { $in: currentUser.blockedUsers } }, // Exclude users blocked by the current user
      ],
    }).select(
      'username profile.firstName profile.lastName profile.avatar profile.bio privacySettings.profileVisibility followers'
    );

    // Calculate relevance scores and add isFollowingCurrentUser flag
    const suggestedUsers = users.map((user) => {
      const score = calculateRelevanceScore(currentUser, user);
      return {
        _id: user._id,
        username: user.username,
        profile: {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          avatar: user.profile.avatar,
          bio: user.profile.bio,
        },
        privacySettings: {
          profileVisibility: user.privacySettings.profileVisibility,
        },
        isFollowingCurrentUser: user.followers.includes(currentUser._id),
        score,
      };
    });

    // Sort by relevance score (descending) and apply pagination
    const sortedUsers = suggestedUsers.sort((a, b) => b.score - a.score);
    const paginatedUsers = sortedUsers.slice((page - 1) * limit, page * limit);

    return res.json({
      success: true,
      data: paginatedUsers,
      meta: {
        total: sortedUsers.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(sortedUsers.length / limit),
      },
      message: 'Suggested users fetched successfully',
    });
  } catch (err) {
    console.error('Get suggested users error:', {
      message: err.message || 'Unknown error',
      stack: err.stack,
    });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Follow a user
exports.followUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: "Invalid or missing userId" });
    }

    const currentUser = await User.findById(req.user._id);
    const userToFollow = await User.findById(userId);

    if (!userToFollow || userToFollow.isDelete) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (currentUser._id.equals(userToFollow._id)) {
      return res.status(400).json({ success: false, message: "Cannot follow yourself" });
    }

    if (currentUser.following.includes(userId)) {
      return res.status(400).json({ success: false, message: "Already following this user" });
    }

    if (userToFollow.blockedUsers.includes(currentUser._id)) {
      return res.status(403).json({ success: false, message: "You are blocked by this user" });
    }

    // Rate limiting
    try {
      await followLimiter.consume(currentUser._id);
    } catch (rlErr) {
      console.error('Rate limit error:', {
        userId: currentUser._id,
        message: rlErr.message,
      });
      return res.status(429).json({
        success: false,
        message: "Follow limit exceeded: Maximum 50 follows per hour",
      });
    }

    if (userToFollow.privacySettings.profileVisibility === "private") {
      await addNotificationToQueue({
        userId: userToFollow._id,
        type: "follow_request",
        message: `${currentUser.username} wants to follow you`,
        relatedId: currentUser._id,
        relatedModel: "User",
      });
      return res.json({
        success: true,
        message: "Follow request sent. Waiting for approval.",
      });
    }

    // Update following and followers with optimistic concurrency
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await User.findOneAndUpdate(
          { _id: currentUser._id, following: { $ne: userId } },
          { $push: { following: userToFollow._id } },
          { session }
        );
        await User.findOneAndUpdate(
          { _id: userId, followers: { $ne: currentUser._id } },
          { $push: { followers: currentUser._id } },
          { session }
        );
      });

      await UserHistory.create({
        userId: currentUser._id,
        field: "following",
        oldValue: "",
        newValue: userToFollow._id.toString(),
        ipAddress: req.ip,
        device: req.headers["user-agent"] || "unknown",
      });

      if (userToFollow.notificationSettings.follows) {
        await addNotificationToQueue({
          userId: userToFollow._id,
          type: "follow",
          message: `${currentUser.username} started following you`,
          relatedId: currentUser._id,
          relatedModel: "User",
        });
      }

      return res.json({
        success: true,
        message: `Now following ${userToFollow.username}`,
      });
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error("Follow user error:", {
      message: err.message || "Unknown error",
      stack: err.stack,
    });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// In friendController.js
exports.cancelFollowRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or missing userId" });
    }

    const currentUser = await User.findById(req.user._id);
    const targetUser = await User.findById(userId);

    if (!targetUser || targetUser.isDelete) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if there is a pending follow request
    const notification = await Notification.findOne({
      userId: targetUser._id,
      type: "follow_request",
      relatedId: currentUser._id,
    });

    if (!notification) {
      return res
        .status(400)
        .json({ success: false, message: "No pending follow request found" });
    }

    // Remove the notification
    await Notification.deleteOne({
      userId: targetUser._id,
      type: "follow_request",
      relatedId: currentUser._id,
    });

    // Log in UserHistory
    await UserHistory.create({
      userId: currentUser._id,
      field: "follow_request_canceled",
      oldValue: targetUser._id.toString(),
      newValue: "",
      ipAddress: req.ip,
      device: req.headers["user-agent"] || "unknown",
    });

    return res.json({
      success: true,
      message: `Canceled follow request to ${targetUser.username}`,
    });
  } catch (err) {
    console.error("Cancel follow request error:", {
      message: err.message || "Unknown error",
      stack: err.stack,
    });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// pending user requests
exports.getPendingFollowRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const notifications = await Notification.find({
      userId: req.user._id,
      type: "follow_request",
    })
      .populate("relatedId", "-password")
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const pendingRequests = notifications.map((notification) => ({
      _id: notification._id,
      user: {
        _id: notification.relatedId._id,
        username: notification.relatedId.username,
        firstName: notification.relatedId.profile.firstName,
        lastName: notification.relatedId.profile.lastName,
        avatar: notification.relatedId.profile.avatar,
      },
      message: notification.message,
      createdAt: notification.createdAt,
    }));

    return res.json({
      success: true,
      data: pendingRequests,
      meta: {
        total: await Notification.countDocuments({
          userId: req.user._id,
          type: "follow_request",
        }),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(
          (await Notification.countDocuments({
            userId: req.user._id,
            type: "follow_request",
          })) / limit
        ),
      },
      message: "Pending follow requests fetched successfully",
    });
  } catch (err) {
    console.error("Get pending follow requests error:", {
      message: err.message || "Unknown error",
      stack: err.stack,
    });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Accept follow request
exports.acceptFollowRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing userId' });
    }

    const currentUser = await User.findById(req.user._id);
    const requester = await User.findById(userId);

    if (!requester || requester.isDelete) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if follow request exists
    const notification = await Notification.findOne({
      userId: currentUser._id,
      type: 'follow_request',
      relatedId: requester._id,
    });
    if (!notification) {
      return res.status(400).json({ success: false, message: 'No pending follow request found' });
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        currentUser.followers.push(requester._id);
        requester.following.push(currentUser._id);
        await Promise.all([currentUser.save({ session }), requester.save({ session })]);

        await Notification.deleteOne({ _id: notification._id }, { session });
      });

      await UserHistory.create({
        userId: currentUser._id,
        field: 'followers',
        oldValue: '',
        newValue: requester._id.toString(),
        ipAddress: req.ip,
        device: req.headers['user-agent'] || 'unknown',
      });

      return res.json({
        success: true,
        message: `Accepted follow request from ${requester.username}`,
      });
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error('Accept follow request error:', {
      message: err.message,
      stack: err.stack,
    });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// reject follow request
exports.rejectFollowRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing userId' });
    }

    const currentUser = await User.findById(req.user._id);
    const requester = await User.findById(userId);

    if (!requester || requester.isDelete) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const notification = await Notification.findOneAndDelete({
      userId: currentUser._id,
      type: 'follow_request',
      relatedId: requester._id,
    });

    if (!notification) {
      return res.status(400).json({ success: false, message: 'No pending follow request found' });
    }

    await UserHistory.create({
      userId: currentUser._id,
      field: 'follow_request_rejected',
      oldValue: requester._id.toString(),
      newValue: '',
      ipAddress: req.ip,
      device: req.headers['user-agent'] || 'unknown',
    });

    return res.json({
      success: true,
      message: `Rejected follow request from ${requester.username}`,
    });
  } catch (err) {
    console.error('Reject follow request error:', {
      message: err.message,
      stack: err.stack,
    });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// unfollow a user 
exports.unfollowUser = async (req, res) => {
    try {
        const { userId } = req.body;
        const currentUser = await User.findById(req.user._id);
        const userToUnfollow = await User.findById(userId);

        if (!userToUnfollow || userToUnfollow.isDelete) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!currentUser.following.includes(userId)) {
           return res.status(400).json({ success: false, message: 'Not following this user' });
        }

        // Remove from following and followers 
        currentUser.following = currentUser.following.filter(id => !id.equals(userId));
        userToUnfollow.followers = userToUnfollow.followers.filter(id => !id.equals(currentUser._id));
        await Promise.all([currentUser.save(), userToUnfollow.save()]);

        // Log in UserHistory
        await UserHistory.create({
            userId: currentUser._id,
            field: 'following',
            oldValue: userToUnfollow._id.toString(),
            newValue: '',
            ipAddress: req.ip,
            device: req.headers['user-agent'] || 'unknown',
        });

        res.json({
            success: true,
            message: `Unfollowed ${userToUnfollow.username}`,
        });
    } catch (err) {
        console.error('Unfollow user error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// Get users you are following
exports.getFollowing = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const user = await User.findById(req.user._id).populate({
      path: 'following',
      select: '-password',
      match: { isDelete: { $ne: true } },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const following = user.following
      .slice((page - 1) * limit, page * limit)
      .map(follow => ({
        _id: follow._id,
        username: follow.username,
        firstName: follow.profile.firstName,
        lastName: follow.profile.lastName,
        avatar: follow.profile.avatar,
      }));

    res.json({
      success: true,
      data: following,
      meta: {
        total: user.following.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(user.following.length / limit),
      },
    });
  } catch (err) {
    console.error('Get following error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get users following you
exports.getFollowers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const user = await User.findById(req.user._id).populate({
      path: 'followers',
      select: '-password',
      match: { isDelete: { $ne: true } },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const followers = user.followers
      .slice((page - 1) * limit, page * limit)
      .map(follower => ({
        _id: follower._id,
        username: follower.username,
        firstName: follower.profile.firstName,
        lastName: follower.profile.lastName,
        avatar: follower.profile.avatar,
      }));

    res.json({
      success: true,
      data: followers,
      meta: {
        total: user.followers.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(user.followers.length / limit),
      },
    });
  } catch (err) {
    console.error('Get followers error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Block a user
exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUser = await User.findById(req.user._id);
    const userToBlock = await User.findById(userId);

    if (!userToBlock || userToBlock.isDelete) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (currentUser._id.equals(userToBlock._id)) {
      return res.status(400).json({ success: false, message: 'Cannot block yourself' });
    }

    if (currentUser.blockedUsers.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User already blocked' });
    }

    // Add to blocked users
    currentUser.blockedUsers.push(userToBlock._id);

    // Remove mutual following relationships
    currentUser.following = currentUser.following.filter(id => !id.equals(userId));
    userToBlock.followers = userToBlock.followers.filter(id => !id.equals(currentUser._id));
    currentUser.followers = currentUser.followers.filter(id => !id.equals(userId));
    userToBlock.following = userToBlock.following.filter(id => !id.equals(currentUser._id));

    await Promise.all([currentUser.save(), userToBlock.save()]);

    // Log in UserHistory
    await UserHistory.create({
      userId: currentUser._id,
      field: 'blockedUsers',
      oldValue: '',
      newValue: userToBlock._id.toString(),
      ipAddress: req.ip,
      device: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      message: `Blocked ${userToBlock.username}`,
    });
  } catch (err) {
    console.error('Block user error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Unblock a user
exports.unblockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUser = await User.findById(req.user._id);
    const userToUnblock = await User.findById(userId);

    if (!userToUnblock || userToUnblock.isDelete) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!currentUser.blockedUsers.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User not blocked' });
    }

    // Remove from blocked users
    currentUser.blockedUsers = currentUser.blockedUsers.filter(id => !id.equals(userId));
    await currentUser.save();

    // Log in UserHistory
    await UserHistory.create({
      userId: currentUser._id,
      field: 'blockedUsers',
      oldValue: userToUnblock._id.toString(),
      newValue: '',
      ipAddress: req.ip,
      device: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      message: `Unblocked ${userToUnblock.username}`,
    });
  } catch (err) {
    console.error('Unblock user error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get blocked users
exports.getBlockedUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const user = await User.findById(req.user._id).populate({
      path: 'blockedUsers',
      select: '-password',
      match: { isDelete: { $ne: true } },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const blockedUsers = user.blockedUsers
      .slice((page - 1) * limit, page * limit)
      .map(blocked => ({
        _id: blocked._id,
        username: blocked.username,
        firstName: blocked.profile.firstName,
        lastName: blocked.profile.lastName,
        avatar: blocked.profile.avatar,
      }));

    res.json({
      success: true,
      data: blockedUsers,
      meta: {
        total: user.blockedUsers.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(user.blockedUsers.length / limit),
      },
    });
  } catch (err) {
    console.error('Get blocked users error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update privacy settings
exports.updatePrivacySettings = async (req, res) => {
  try {
    const { profileVisibility, showLocation, showEmail } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Validate inputs
    const validVisibilities = ['public', 'followers', 'private'];
    if (profileVisibility && !validVisibilities.includes(profileVisibility)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid profile visibility setting',
      });
    }

    // Track changes for history
    const changes = [];
    const fieldsToCheck = {
      'privacySettings.profileVisibility': profileVisibility,
      'privacySettings.showLocation': showLocation,
      'privacySettings.showEmail': showEmail,
    };

    for (const [field, newValue] of Object.entries(fieldsToCheck)) {
      if (newValue !== undefined) {
        const oldValue = field.includes('privacySettings.')
          ? user.privacySettings[field.split('.')[1]]
          : user[field.split('.')[0]];
        if (oldValue !== newValue) {
          changes.push({
            userId: user._id,
            field,
            oldValue: oldValue || '',
            newValue: newValue || '',
            ipAddress: req.ip,
            device: req.headers['user-agent'] || 'unknown',
          });
        }
      }
    }

    // Update privacy settings
    user.privacySettings = {
      profileVisibility: profileVisibility || user.privacySettings.profileVisibility,
      showLocation: showLocation !== undefined ? showLocation : user.privacySettings.showLocation,
      showEmail: showEmail !== undefined ? showEmail : user.privacySettings.showEmail,
    };

    await user.save();

    // Log changes to UserHistory
    if (changes.length > 0) {
      await UserHistory.insertMany(changes);
    }

    // Send notification if enabled
    if (user.notificationSettings.emailNotifications) {
      await addNotificationToQueue({
        userId: user._id,
        type: 'account_change',
        message: 'Your privacy settings have been updated.',
      });
    }

    res.json({
      success: true,
      data: user.privacySettings,
      message: 'Privacy settings updated successfully',
    });
  } catch (err) {
    console.error('Update privacy settings error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};