const express = require('express');
const router = express.Router();
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  resendVerificationCode,
  checkUsername,
  verifyUser,
  getLinkedAccounts,
  linkAccount,
  switchAccount,
  logout,
  verifyResetOtp,
  deleteUser,
  recoverAccount,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/check-username', checkUsername)
router.post('/resend-verification', resendVerificationCode);
router.put('/reset-password/:token', resetPassword);
router.post('/verify', verifyUser);

router.use(protect); 
// Protected routes (require authentication)
router.get('/linked-accounts', getLinkedAccounts);
router.post('/link-account', linkAccount);
router.post('/switch-account', switchAccount);
router.post('/logout', logout);
router.delete('/delete', deleteUser);
router.post('/recover-account', recoverAccount);

module.exports = router;