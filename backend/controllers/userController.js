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

    // validate errors array
    const errors = [];

    // Validate username
    if (username && username !== user.username) {
      if (username.length < 3) {
        errors.push('Username must be at least 3 characters');
      } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.push('Username can only contain letters, numbers, and underscores');
      } else {
        const usernameExists = await User.findOne({ username, isDelete: { $ne: true } });
        if (usernameExists) {
          errors.push('Username already taken');
        }
      }
    }

    // Validate email
    if (email && email !== user.email) {
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        errors.push('Invalid email format');
      } else {
        const emailExists = await User.findOne({ email, isDelete: { $ne: true } });
        if (emailExists) {
          errors.push('Email already taken');
        }
      }
    }

    // Validate phone number
    if (phoneNumber && phoneNumber !== user.phoneNumber) {
      if (!/^\+?[\d\s\-()]{7,15}$/.test(phoneNumber)) {
        errors.push('Invalid phone number format');
      } else {
        const phoneExists = await User.findOne({ phoneNumber, isDelete: { $ne: true } });
        if (phoneExists) {
          errors.push('Phone number already taken');
        }
      }
    }

    // Validate location
    let parsedLocation = location;
    if (typeof location === 'string') {
      try {
        parsedLocation = JSON.parse(location);
      } catch (err) {
        errors.push('Invalid location format');
      }
    }
    if (parsedLocation && (!parsedLocation.latitude || !parsedLocation.longitude)) {
      errors.push('Location must include valid latitude and longitude');
    }
    
    // Validate links
    let parsedLinks = links;
    if (typeof links === 'string') {
      try {
        parsedLinks = JSON.parse(links);
      } catch (err) {
        errors.push('Invalid links format');
      }
    }
    if (parsedLinks && !Array.isArray(parsedLinks)) {
      errors.push('Links must be an array');
    } else if (parsedLinks) {
      for (const link of parsedLinks) {
        if (!link.title || !link.url || typeof link.title !== 'string' || typeof link.url !== 'string') {
          errors.push('Each link must have a valid title and URL as strings');
        }
      }
    }

    // Validate birth date
    if (birthDate) {
      const parsedDate = new Date(birthDate);
      if (isNaN(parsedDate)) {
        errors.push('Invalid birth date format');
      }
    }
   
    // If there are validation errors, return them
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Invalid field(s)', errors });
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
      'profile.links': parsedLinks,
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
    if (birthDate) user.profile.dateOfBirth = new Date(birthDate);
    if (parsedLinks !== undefined) user.profile.links = parsedLinks || [];
    if (req.files?.avatar) user.profile.avatar = req.files.avatar[0].url;
    if (req.files?.coverPhoto) user.profile.coverPhoto = req.files.coverPhoto[0].url;

    // Save changes to history
    if (changes.length > 0) {
      await UserHistory.insertMany(changes);
    }

    await user.save();

    res.json({ success: true, data: user });
  } catch (err) {
    console.error('Update user details error:', err.message, err.stack);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
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

// Check Username Availability
exports.checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }
    if (username.length < 3) {
      return res.status(400).json({ success: false, message: 'Username must be at least 3 characters' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username can only contain letters, numbers, and underscores',
      });
    }
    const usernameExists = await User.findOne({ username, isDelete: { $ne: true } });
    res.json({ success: true, available: !usernameExists, message: usernameExists ? 'Username already taken' : 'Username available' });
  } catch (err) {
    console.error('Check username availability error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Check Email Availability
exports.checkEmailAvailability = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    const emailExists = await User.findOne({ email, isDelete: { $ne: true } });
    res.json({ success: true, available: !emailExists });
  } catch (err) {
    console.error('Check email availability error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Check Phone Number Availability
exports.checkPhoneAvailability = async (req, res) => {
  try {
    const { phoneNumber } = req.query;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    if (!/^\+?[\d\s\-()]{7,15}$/.test(phoneNumber)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format' });
    }
    const phoneExists = await User.findOne({ phoneNumber, isDelete: { $ne: true } });
    res.json({ success: true, available: !phoneExists });
  } catch (err) {
    console.error('Check phone number availability error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get Other User Details
exports.getOtherUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // Find user by ID, exclude sensitive fields
    const user = await User.findById(userId).select('-password -sessions.token');
    if (!user || user.isDelete) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    console.error('Get other user details error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
