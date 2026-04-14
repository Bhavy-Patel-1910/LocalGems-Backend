const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { sendEmail } = require('../utils/email');

/**
 * Generate JWT tokens
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
  });
  return { accessToken, refreshToken };
};

/**
 * @desc   Register new user
 * @route  POST /api/auth/register
 * @access Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, locationCity, locationState } = req.body;

    if (!['talent', 'talent_provider'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be talent or talent_provider' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      locationCity,
      locationState,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Please login.',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Login user
 * @route  POST /api/auth/login
 * @access Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      data: {
        user,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Refresh access token
 * @route  POST /api/auth/refresh
 * @access Public
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Refresh token required' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken: newRefresh } = generateTokens(user._id);
    user.refreshToken = newRefresh;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, data: { accessToken, refreshToken: newRefresh } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Forgot password — send reset email
 * @route  POST /api/auth/forgot-password
 * @access Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists
      return res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'LocalGems — Password Reset',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto">
            <h2 style="color:#f97316">Reset Your Password</h2>
            <p>Hi ${user.name},</p>
            <p>Click the button below to reset your password. This link expires in <strong>15 minutes</strong>.</p>
            <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
              Reset Password
            </a>
            <p style="margin-top:16px;color:#666">If you didn't request this, ignore this email.</p>
          </div>
        `,
      });
      res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });
    } catch (emailErr) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Reset password using token
 * @route  POST /api/auth/reset-password/:token
 * @access Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful. Please login.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get current logged-in user
 * @route  GET /api/auth/me
 * @access Private
 */
const getMe = async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};

/**
 * @desc   Logout
 * @route  POST /api/auth/logout
 * @access Private
 */
const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+refreshToken');
    user.refreshToken = undefined;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refreshToken, forgotPassword, resetPassword, getMe, logout };
