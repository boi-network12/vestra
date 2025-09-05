const mongoose = require("mongoose");
const { calculateRelevanceScore } = require("../helper/suggestionRelevanceScore");
const User = require("../models/User")
const UserHistory = require('../models/UserHistory');
const Notification = require('../models/Notification');
const { addNotificationToQueue } = require("../jobs/notificationJob");
const { RateLimiterMemory } = require("rate-limiter-flexible");

const followLimiter = new RateLimiterMemory({ points: 50, duration: 3600 });
const blockLimiter = new RateLimiterMemory({ points: 20, duration: 3600 });
const unfollowLimiter = new RateLimiterMemory({ points: 50, duration: 3600 });

// get suggested users (instagram like algorithm)
exports.getSuggestedUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, searchQuery = '' } = req.query;
    
    const currentUser = await User.findById(req.user._id);

    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ✅ Block unverified users from fetching suggestions
    if (!currentUser.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Account not verified. Please verify your account to see suggested users."
      });
    }

    // Fetch all users except the current user, blocked users, and deleted users
    let query = {
      _id: { 
        $ne: currentUser._id, 
        $nin: currentUser.blockedUsers, 
        $nin: currentUser.following 
      },
      isDelete: { $ne: true },
      isVerified: true
    };

    if (searchQuery) {
      query.$or = [
        { username: { $regex: searchQuery, $options: 'i' } },
        { 'profile.firstName': { $regex: searchQuery, $options: 'i' } },
        { 'profile.lastName': { $regex: searchQuery, $options: 'i' } },
      ];
      query.$or.push({
        _id: { $in: currentUser.following },
        followers: currentUser._id, 
      });
    } else {
      query._id.$nin = currentUser.following;
    }

    // Fetch users based on query
    const users = await User.find(query)
      .select("username profile followers following privacySettings")
      .lean();

    // Calculate relevance scores and follow status
    const scoredUsers = await Promise.all(
      users.map(async (user) => {
        if (!user._id) return null;
        const score = await calculateRelevanceScore(currentUser, user);
        let followStatus = "FOLLOW";

        
        const isFollowedBy = currentUser.followers?.some((id) => id.toString() === user._id.toString());
        const isFollowing = currentUser.following?.some((id) => id.toString() === user._id.toString());
        const pendingRequest = await Notification.findOne({
          userId: user._id,
          type: 'follow_request',
          relatedId: currentUser._id,
        });

        // Prioritize mutual status for search results
        if (isFollowing && isFollowedBy) {
          followStatus = 'MUTUAL';
        } else if (pendingRequest && user.privacySettings?.profileVisibility === 'private') {
          followStatus = 'REQUESTED';
        } else if (!isFollowing && isFollowedBy) {
          followStatus = 'FOLLOW_BACK';
        } else if (isFollowing) {
          followStatus = 'FOLLOWING';
        } else {
          followStatus = 'FOLLOW';
        }

        // Calculate mutual followers count
        const mutualFollowersCount = user.followers.filter((followerId) =>
          currentUser.following.some((followingId) => followingId.toString() === followerId.toString())
        ).length;


        return {
          ...user,
          relevanceScore: score,
          followStatus,
          isMutual: currentUser.following.includes(user._id.toString()) && isFollowedBy,
        };
      })
    );

    // Sort users by relevance score and paginate
    const sortedUsers = scoredUsers
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice((page - 1) * limit, page * limit);

    // Format response
    const formattedUsers = sortedUsers.map((user) => ({
      _id: user._id,
      username: user.username,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      avatar: user.profile.avatar,
      bio: user.profile.bio,
      followStatus: user.followStatus,
      isMutual: user.isMutual,
    }));

    return res.json({
      success: true,
      data: formattedUsers,
      meta: {
        total: scoredUsers.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(scoredUsers.length / limit),
      },
      message: "Suggested users fetched successfully",
    });
  } catch (err) {
    console.error("Get suggested users error:", {
      message: err.message || "Unknown error",
      stack: err.stack,
    });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Follow a user
exports.followUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: "Invalid or missing userId" });
    }

    // Apply rate limiting
    try {
      await followLimiter.consume(req.ip);
    } catch (rateErr) {
      return res.status(429).json({ success: false, message: "Too many follow requests. Try again later." });
    }

    const currentUser = await User.findById(req.user._id);
    const targetUser = await User.findById(userId);

    if (!targetUser || targetUser.isDelete) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (currentUser._id.equals(targetUser._id)) {
      return res.status(400).json({ success: false, message: "Cannot follow yourself" });
    }

    if (currentUser.following.includes(userId)) {
      return res.status(400).json({ success: false, message: "Already following this user" });
    }

    // Check if there's a pending follow request
    const existingRequest = await Notification.findOne({
      userId: targetUser._id,
      type: "follow_request",
      relatedId: currentUser._id,
    });

    if (existingRequest) {
      return res.status(400).json({ success: false, message: "Follow request already sent" });
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        let followStatus;
        if (targetUser.privacySettings.profileVisibility === "private") {
          // Create a follow request notification
          await Notification.create(
            [{
              userId: targetUser._id,
              type: "follow_request",
              relatedId: currentUser._id,
              message: `${currentUser.username} requested to follow you`,
            }],
            { session }
          );

          await addNotificationToQueue({
            userId: targetUser._id,
            type: "follow_request",
            message: `${currentUser.username} requested to follow you`,
            relatedId: currentUser._id,
          });

          // Log in UserHistory
          await UserHistory.create(
            [{
              userId: currentUser._id,
              field: "follow_request_sent",
              oldValue: "",
              newValue: targetUser._id.toString(),
              ipAddress: req.ip,
              device: req.headers["user-agent"] || "unknown",
            }],
            { session }
          );

          followStatus = "REQUESTED";
        } else {
          // Direct follow for public or followers-only profiles
         if (!currentUser.following.includes(targetUser._id)) {
            currentUser.following.push(targetUser._id);
          }
          if (!targetUser.followers.includes(currentUser._id)) {
            targetUser.followers.push(currentUser._id);
          }

          await Promise.all([
            currentUser.save({ session }),
            targetUser.save({ session }),
          ]);

          // Create follow notification
          await Notification.create(
            [{
              userId: targetUser._id,
              type: "follow",
              relatedId: currentUser._id,
              message: `${currentUser.username} started following you`,
            }],
            { session }
          );

          await addNotificationToQueue({
            userId: targetUser._id,
            type: "follow",
            message: `${currentUser.username} started following you`,
            relatedId: currentUser._id,
          });

          // Log in UserHistory
          await UserHistory.create(
            [{
              userId: currentUser._id,
              field: "following",
              oldValue: "",
              newValue: targetUser._id.toString(),
              ipAddress: req.ip,
              device: req.headers["user-agent"] || "unknown",
            }],
            { session }
          );

          followStatus = "FOLLOWING";
        }

        return res.json({
          success: true,
          message: followStatus === "REQUESTED"
            ? `Follow request sent to ${targetUser.username}`
            : `Now following ${targetUser.username}`,
          followStatus,
        });
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
      .populate({
        path: "relatedId",
        select: "-password",
        model: "User",
      })
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

// Fetch followers with mutual status and additional profile details
exports.getFollowersWithDetails = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const user = await User.findById(req.user._id).populate({
      path: 'followers',
      select: '-password',
      match: { isDelete: { $ne: true } },
      options: { sort: { username: 1 } }, // Sort alphabetically by username
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const followers = await Promise.all(
      user.followers.slice((page - 1) * limit, page * limit).map(async (follower) => {
        // Check if the follower is also being followed by the current user (mutual)
        const isMutual = user.following.some((id) => id.equals(follower._id));
        return {
          _id: follower._id,
          username: follower.username,
          firstName: follower.profile.firstName,
          lastName: follower.profile.lastName,
          avatar: follower.profile.avatar,
          bio: follower.profile.bio, // Additional profile detail
          isMutual,
        };
      })
    );

    res.json({
      success: true,
      data: followers,
      meta: {
        total: user.followers.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(user.followers.length / limit),
      },
      message: 'Followers fetched successfully',
    });
  } catch (err) {
    console.error('Get followers with details error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Fetch following with mutual status and additional profile details
exports.getFollowingWithDetails = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const user = await User.findById(req.user._id).populate({
      path: 'following',
      select: '-password',
      match: { isDelete: { $ne: true } },
      options: { sort: { username: 1 } }, // Sort alphabetically by username
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const following = await Promise.all(
      user.following.slice((page - 1) * limit, page * limit).map(async (followed) => {
        // Check if the followed user also follows the current user (mutual)
        const followedUser = await User.findById(followed._id);
        const isMutual = followedUser.followers.some((id) => id.equals(user._id));
        return {
          _id: followed._id,
          username: followed.username,
          firstName: followed.profile.firstName,
          lastName: followed.profile.lastName,
          avatar: followed.profile.avatar,
          bio: followed.profile.bio, // Additional profile detail
          isMutual,
        };
      })
    );

    res.json({
      success: true,
      data: following,
      meta: {
        total: user.following.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(user.following.length / limit),
      },
      message: 'Following fetched successfully',
    });
  } catch (err) {
    console.error('Get following with details error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Fetch followers with details for another user
exports.getOtherUserFollowersWithDetails = async (req, res) => {
  try {
    const { userId } = req.params; // Get userId from URL params
    const { page = 1, limit = 20 } = req.query;

    // Validate userId
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing userId' });
    }

    const currentUser = await User.findById(req.user._id);
    const targetUser = await User.findById(userId).populate({
      path: 'followers',
      select: '-password',
      match: { isDelete: { $ne: true } },
      options: { sort: { username: 1 } }, // Sort alphabetically by username
    });

    if (!targetUser || targetUser.isDelete) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check privacy settings
    const { profileVisibility } = targetUser.privacySettings;
    const isFollowingTarget = targetUser.followers.some((id) => id.equals(currentUser._id));
    const isBlocked = currentUser.blockedUsers.includes(targetUser._id) || targetUser.blockedUsers.includes(currentUser._id);

    if (isBlocked) {
      return res.status(403).json({ success: false, message: 'Cannot view followers due to block status' });
    }

    if (profileVisibility === 'private' && !isFollowingTarget && !currentUser._id.equals(targetUser._id)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot view followers of a private account unless you are following',
      });
    }

    if (profileVisibility === 'followers' && !isFollowingTarget && !currentUser._id.equals(targetUser._id)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot view followers unless you are following this user',
      });
    }

    const followers = await Promise.all(
      targetUser.followers.slice((page - 1) * limit, page * limit).map(async (follower) => {
        // Check if the follower is also followed by the current user (mutual)
        const isMutual = currentUser.following.some((id) => id.equals(follower._id));
        return {
          _id: follower._id,
          username: follower.username,
          firstName: follower.profile.firstName,
          lastName: follower.profile.lastName,
          avatar: follower.profile.avatar,
          bio: follower.profile.bio,
          isMutual,
        };
      })
    );

    // Log the action in UserHistory
    await UserHistory.create({
      userId: currentUser._id,
      field: 'viewed_followers',
      oldValue: '',
      newValue: targetUser._id.toString(),
      ipAddress: req.ip,
      device: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      data: followers,
      meta: {
        total: targetUser.followers.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(targetUser.followers.length / limit),
      },
      message: `Followers of ${targetUser.username} fetched successfully`,
    });
  } catch (err) {
    console.error('Get other user followers with details error:', {
      message: err.message || 'Unknown error',
      stack: err.stack,
    });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Fetch following with details for another user
exports.getOtherUserFollowingWithDetails = async (req, res) => {
  try {
    const { userId } = req.params; // Get userId from URL params
    const { page = 1, limit = 20 } = req.query;

    // Validate userId
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing userId' });
    }

    const currentUser = await User.findById(req.user._id);
    const targetUser = await User.findById(userId).populate({
      path: 'following',
      select: '-password',
      match: { isDelete: { $ne: true } },
      options: { sort: { username: 1 } }, // Sort alphabetically by username
    });

    if (!targetUser || targetUser.isDelete) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check privacy settings
    const { profileVisibility } = targetUser.privacySettings;
    const isFollowingTarget = targetUser.followers.some((id) => id.equals(currentUser._id));
    const isBlocked = currentUser.blockedUsers.includes(targetUser._id) || targetUser.blockedUsers.includes(currentUser._id);

    if (isBlocked) {
      return res.status(403).json({ success: false, message: 'Cannot view following due to block status' });
    }

    if (profileVisibility === 'private' && !isFollowingTarget && !currentUser._id.equals(targetUser._id)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot view following of a private account unless you are following',
      });
    }

    if (profileVisibility === 'followers' && !isFollowingTarget && !currentUser._id.equals(targetUser._id)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot view following unless you are following this user',
      });
    }

    const following = await Promise.all(
      targetUser.following.slice((page - 1) * limit, page * limit).map(async (followed) => {
        // Check if the followed user also follows the current user (mutual)
        const followedUser = await User.findById(followed._id);
        const isMutual = followedUser.followers.some((id) => id.equals(currentUser._id));
        return {
          _id: followed._id,
          username: followed.username,
          firstName: followed.profile.firstName,
          lastName: followed.profile.lastName,
          avatar: followed.profile.avatar,
          bio: followed.profile.bio,
          isMutual,
        };
      })
    );

    // Log the action in UserHistory
    await UserHistory.create({
      userId: currentUser._id,
      field: 'viewed_following',
      oldValue: '',
      newValue: targetUser._id.toString(),
      ipAddress: req.ip,
      device: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      data: following,
      meta: {
        total: targetUser.following.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(targetUser.following.length / limit),
      },
      message: `Following of ${targetUser.username} fetched successfully`,
    });
  } catch (err) {
    console.error('Get other user following with details error:', {
      message: err.message || 'Unknown error',
      stack: err.stack,
    });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};