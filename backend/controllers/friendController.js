const { calculateRelevanceScore } = require("../helper/suggestionRelevanceScore");
const User = require("../models/User")
const UserHistory = require('../models/UserHistory');
const Notification = require('../models/Notification');
const { addNotificationToQueue } = require("../jobs/notificationJob");

// get suggested users (instagram like algorithm)
exports.getSuggestedUsers = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id);
        if (!currentUser) {
            return res.status(404).json({ success: false, message: "user not found" })
        }

        // Fetch all users excluding self, blocked users, and already followed users
        const users = await User.find({
            _id: { $ne: currentUser._id, $nin: currentUser.blockedUsers },
            isDelete: { $ne: true },
            isVerified: true
        }).select("-password -createdAt -updatedAt");

        // calculate relevance scores
        const suggestedUsers = users
           .map(user => ({
             user,
             score: calculateRelevanceScore(currentUser, user)
           }))
             .filter(({ score }) => score > 0)
             .sort((a, b) => b.score - a.score)
             .slice(0, 10)
             .map(({ user }) => ({
                _id: user._id,
                username: user.username,
                profile: {
                    firstName: user.profile.firstName,
                    lastName: user.profile.lastName,
                    avatar: user.profile.avatar,
                    bio: user.profile.bio
                },
             }));

             res.join({
                success: true,
                data: suggestedUsers,
                message: "suggested users fetched successfully"
             })
    } catch (err) {
        console.error('Get suggested users error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// Follow a user
exports.followUser = async (req, res) => {
    try {
        const { userId } = res.body;
        const currentUser = await User.findById(req.user._id);
        const userToFollow = await User.findById(userId);

        if (!userToFollow || userToFollow.isDelete) {
           return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (currentUser._id.equals(userToFollow._id)) {
           return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
        }

        if (currentUser.following.includes(userId)) {
           return res.status(400).json({ success: false, message: 'Already following this user' });
        }

        if (userToFollow.blockedUsers.includes(currentUser._id)) {
           return res.status(403).json({ success: false, message: 'You are blocked by this user' });
        }

        // Respect privacy settings
        if (userToFollow.privacySettings.profileVisibility === 'private') {
            await addNotificationToQueue({
                userId: userToFollow._id,
                type: 'follow_request',
                message: `${currentUser.username} wants to follow you`,
                relatedId: currentUser._id,
                relatedModel: 'User'
            });

            res.json({
                success: true,
                message: 'Follow request sent. Waiting for approval.',
            });
            return;
        }

        // Add to following and followers
        currentUser.following.push(userToFollow._id);
        userToFollow.followers.push(currentUser._id);
        await Promise.all([currentUser.save(), userToFollow.save()]);

        // Log in userHistory
        await UserHistory.create({
            userId: currentUser._id,
            field: 'following',
            oldValue: '',
            newValue: userToFollow._id.toString(),
            ipAddress: req.ip,
            device: req.headers['user-agent'] || 'unknown',
        });

        // send notification i enabled 
        if (userToFollow.notificationSettings.follows) {
            await addNotificationToQueue({
                userId: userToFollow._id,
                type: 'follow',
                message: `${currentUser.username} started following you`,
                relatedId: currentUser._id,
                relatedModel: 'User',
            });
        }

        res.json({
            success: true,
            message: `Now following ${userToFollow.username}`,
        });
    } catch (err) {
        console.error('Follow user error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

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