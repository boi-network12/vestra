const express = require('express');
const router = express.Router();
const {
  getUserDetails,
  updateUserDetails,
  getUserHistory,
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { uploadMedia } = require('../middleware/uploadMiddleware')

router.use(protect); // Protect all routes below

router.get('/me', getUserDetails);
router.put('/me', uploadMedia(['avatar', 'coverPhoto']), updateUserDetails);
router.get('/history/:userId', restrictTo('admin'), getUserHistory); // Admin only

module.exports = router;