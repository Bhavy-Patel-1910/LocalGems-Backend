const express = require('express');
const router = express.Router();
const { register, login, refreshToken, forgotPassword, resetPassword, getMe, logout } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
