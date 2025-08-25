const User = require('../models/User');
const UserHistory = require('../models/UserHistory');

// Get User Details
exports.getUserDetails = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      console.error('Invalid req.user:', req.user);
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid user data' });
    }
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
    const {
      username,
      email,
      phoneNumber,
      firstName,
      lastName,
      middleName,
      location,
      bio,
      links,
      birthDate,
    } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check username uniqueness
    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ username, isDeleted: { $ne: true } });
      if (usernameExists) {
        return res.status(400).json({ success: false, message: 'Username already taken' });
      }
    }

    // Check email uniqueness
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email, isDeleted: { $ne: true } });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email already taken' });
      }
    }

    // Validate links structure
    if (links) {
      let parsedLinks;
      try {
        parsedLinks = typeof links === 'string' ? JSON.parse(links) : links;
      } catch (err) {
        return res.status(400).json({ success: false, message: 'Invalid links format' });
      }
      if (!Array.isArray(parsedLinks)) {
        return res.status(400).json({ success: false, message: 'Links must be an array' });
      }
      for (const link of parsedLinks) {
        if (!link.title || !link.url || typeof link.title !== 'string' || typeof link.url !== 'string') {
          return res.status(400).json({
            success: false,
            message: 'Each link must have a valid title and URL as strings',
          });
        }
      }
    }

    // Parse location if sent as string
    let parsedLocation = location;
    if (typeof location === 'string') {
      try {
        parsedLocation = JSON.parse(location);
      } catch (err) {
        return res.status(400).json({ success: false, message: 'Invalid location format' });
      }
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
      'profile.location': parsedLocation,
      'profile.dateOfBirth': birthDate,
      'profile.links': links ? (typeof links === 'string' ? JSON.parse(links) : links) : undefined,
      'profile.avatar': req.files?.avatar ? req.files.avatar[0].url : undefined,
      'profile.coverPhoto': req.files?.coverPhoto ? req.files.coverPhoto[0].url : undefined,
    };

    for (const [field, newValue] of Object.entries(fieldsToCheck)) {
      if (newValue !== undefined) {
        let oldValue;
        if (field === 'profile.links') {
          oldValue = user.profile.links || [];
          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes.push({
              userId: user._id,
              field,
              oldValue: JSON.stringify(oldValue),
              newValue: JSON.stringify(newValue),
              ipAddress: req.ip,
              device: req.headers['user-agent'] || 'unknown',
            });
          }
        } else if (field === 'profile.location') {
          oldValue = user.profile.location || {};
          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes.push({
              userId: user._id,
              field,
              oldValue: JSON.stringify(oldValue),
              newValue: JSON.stringify(newValue),
              ipAddress: req.ip,
              device: req.headers['user-agent'] || 'unknown',
            });
          }
        } else {
          oldValue = field.includes('profile.')
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
    }

    // Update user fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (firstName) user.profile.firstName = firstName;
    if (lastName) user.profile.lastName = lastName;
    if (middleName !== undefined) user.profile.middleName = middleName;
    if (bio) user.profile.bio = bio;
    if (parsedLocation && parsedLocation.latitude && parsedLocation.longitude) {
      user.profile.location = {
        coordinates: [parsedLocation.longitude, parsedLocation.latitude],
        city: parsedLocation.city || user.profile.location?.city,
        country: parsedLocation.country || user.profile.location?.country,
      };
    }
    if (birthDate) {
      const parsedDate = new Date(birthDate);
      if (!isNaN(parsedDate)) {
        user.profile.dateOfBirth = parsedDate;
      } else {
        return res.status(400).json({ success: false, message: 'Invalid birth date format' });
      }
    }
    if (links !== undefined) {
      user.profile.links = links ? (typeof links === 'string' ? JSON.parse(links) : links) : [];
    }
    if (req.files?.avatar) {
      user.profile.avatar = req.files.avatar[0].url;
    }
    if (req.files?.coverPhoto) {
      user.profile.coverPhoto = req.files.coverPhoto[0].url;
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