const User = require('../models/User.model');
const TalentProfile = require('../models/TalentProfile.model');
const Booking = require('../models/Booking.model');

const getAnalytics = async (req, res, next) => {
  try {
    const [totalUsers, totalTalents, totalProviders, totalBookings, pendingProfiles, completedBookings] =
      await Promise.all([
        User.countDocuments(), User.countDocuments({ role: 'talent' }),
        User.countDocuments({ role: 'talent_provider' }), Booking.countDocuments(),
        TalentProfile.countDocuments({ profileStatus: 'pending' }),
        Booking.countDocuments({ status: 'completed' }),
      ]);
    const revenueAgg = await Booking.aggregate([
      { $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$amountAgreed' } } },
    ]);
    res.json({ success: true, data: { totalUsers, totalTalents, totalProviders, totalBookings, completedBookings, pendingProfiles, totalRevenue: revenueAgg[0]?.total || 0 } });
  } catch (error) { next(error); }
};

const getPendingProfiles = async (req, res, next) => {
  try {
    const profiles = await TalentProfile.find({ profileStatus: 'pending' })
      .populate('userId', 'name email locationCity profilePicUrl createdAt').sort('-createdAt');
    res.json({ success: true, data: { profiles } });
  } catch (error) { next(error); }
};

const updateProfileStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    const profile = await TalentProfile.findByIdAndUpdate(req.params.id, { profileStatus: status }, { new: true });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    res.json({ success: true, data: { profile } });
  } catch (error) { next(error); }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const query = role ? { role } : {};
    const users = await User.find(query).sort('-createdAt').limit(parseInt(limit)).skip((parseInt(page)-1)*parseInt(limit));
    const total = await User.countDocuments(query);
    res.json({ success: true, data: { users, total } });
  } catch (error) { next(error); }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, data: { user } });
  } catch (error) { next(error); }
};

const toggleFeature = async (req, res, next) => {
  try {
    const profile = await TalentProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    profile.isFeatured = !profile.isFeatured;
    await profile.save();
    res.json({ success: true, data: { profile } });
  } catch (error) { next(error); }
};

module.exports = { getAnalytics, getPendingProfiles, updateProfileStatus, getAllUsers, toggleUserStatus, toggleFeature };
