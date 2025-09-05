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
  acceptFollowRequest,
  rejectFollowRequest,
  getPendingFollowRequests,
  cancelFollowRequest,
  getFollowersWithDetails,
  getFollowingWithDetails,
  getOtherUserFollowingWithDetails,
  getOtherUserFollowersWithDetails,
} = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Protect all routes

router.get('/suggested', getSuggestedUsers);
router.post('/follow', followUser);
router.post('/accept-follow-request', acceptFollowRequest);
router.post('/reject-follow-request', rejectFollowRequest);
router.post('/unfollow', unfollowUser);
router.get('/following', getFollowing);
router.get('/followers', getFollowers);
router.post('/block', blockUser);
router.post('/unblock', unblockUser);
router.get('/blocked', getBlockedUsers);
router.patch('/privacy-settings', updatePrivacySettings);
router.get('/pending-follow-requests', getPendingFollowRequests);
router.post("/cancel-follow-request", cancelFollowRequest);
router.get('/followers/details', getFollowersWithDetails);
router.get('/following/details', getFollowingWithDetails);
router.get('/other-followers/:userId', getOtherUserFollowersWithDetails); 
router.get('/other-following/:userId', getOtherUserFollowingWithDetails); 

module.exports = router;