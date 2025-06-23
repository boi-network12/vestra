const User = require('../models/User');
const UserHistory = require('../models/UserHistory');
const { uploadMedia } = require('../utils/cloudinary');

// Get User Details
exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -sessions.token');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    console.error('Get user details error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update User Details
exports.updateUserDetails = async (req, res) => {
  try {
    const { username, email, phoneNumber, firstName, lastName, middleName, bio, location } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Track changes for history
    const changes = [];
    const fieldsToCheck = {
      username,
      email,
      phoneNumber,
      'profile.firstName': firstName,
      'profile.lastName': lastName,
      'profile.middleName': middleName,
      'profile.bio': bio,
      'profile.location': location,
    };

    for (const [field, newValue] of Object.entries(fieldsToCheck)) {
      if (newValue !== undefined) {
        const oldValue = field.includes('profile.')
          ? user.profile[field.split('.')[1]]
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

    // Update user fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (firstName) user.profile.firstName = firstName;
    if (lastName) user.profile.lastName = lastName;
    if (middleName !== undefined) user.profile.middleName = middleName;
    if (bio) user.profile.bio = bio;
    if (location && location.latitude && location.longitude) {
      user.profile.location = {
        coordinates: [location.longitude, location.latitude],
        city: location.city || user.profile.location.city,
        country: location.country || user.profile.location.country,
      };
    }

    // Save changes to history
    if (changes.length > 0) {
      await UserHistory.insertMany(changes);
    }

    await user.save();

    res.json({ success: true, data: user });
  } catch (err) {
    console.error('Update user details error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update Profile Picture
exports.updateProfilePicture = [
  uploadMedia('avatar'),
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Save old avatar to history
      if (user.profile.avatar && req.file) {
        await UserHistory.create({
          userId: user._id,
          field: 'profile.avatar',
          oldValue: user.profile.avatar,
          newValue: req.file.url,
          ipAddress: req.ip,
          device: req.headers['user-agent'] || 'unknown',
        });
      }

      // Update avatar
      user.profile.avatar = req.file ? req.file.url : user.profile.avatar;
      await user.save();

      res.json({ success: true, data: { avatar: user.profile.avatar } });
    } catch (err) {
      console.error('Update profile picture error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
];

// Get User History (Admin only)
exports.getUserHistory = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { userId } = req.params;
    const history = await UserHistory.find({ userId }).sort({ changedAt: -1 });

    res.json({ success: true, data: history });
  } catch (err) {
    console.error('Get user history error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};