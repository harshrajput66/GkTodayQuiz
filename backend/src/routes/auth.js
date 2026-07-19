const express = require('express');
const router = express.Router();
const { register, verifyOtp, resendOtp, login, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', login);
router.get('/me', authenticate, getMe);

module.exports = router;
