const express = require('express');
const router = express.Router();
const {
  getUserDetails,
  updateUserDetails,
  checkUsernameAvailability,
  checkEmailAvailability,
  checkPhoneAvailability,
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { uploadMedia } = require('../middleware/uploadMiddleware')

router.use(protect); // Protect all routes below

router.get('/me', getUserDetails);
router.put('/me', uploadMedia(['avatar', 'coverPhoto']), updateUserDetails);

router.get('/check-username', checkUsernameAvailability);
router.get('/check-email', checkEmailAvailability);
router.get('/check-phone', checkPhoneAvailability);


module.exports = router;