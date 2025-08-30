const express = require('express');
const router = express.Router();
const {
  getSuggestedUsers,
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
  blockUser,
  unblockUser,
  getBlockedUsers,
  updatePrivacySettings,
} = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Protect all routes

router.get('/suggested', getSuggestedUsers);
router.post('/follow', followUser);
router.post('/unfollow', unfollowUser);
router.get('/following', getFollowing);
router.get('/followers', getFollowers);
router.post('/block', blockUser);
router.post('/unblock', unblockUser);
router.get('/blocked', getBlockedUsers);
router.patch('/privacy-settings', updatePrivacySettings);

module.exports = router;