const TalentProfile = require('../models/TalentProfile.model');
const User = require('../models/User.model');

/**
 * @desc   Create/Update talent profile
 * @route  POST /api/talent/profile
 * @access Private (talent only)
 */
const upsertProfile = async (req, res, next) => {
  try {
    const data = { ...req.body };
    let profile = await TalentProfile.findOne({ userId: req.user._id });

    if (profile) {
      profile = await TalentProfile.findOneAndUpdate(
        { userId: req.user._id },
        { ...data, profileStatus: 'approved' }, // auto-approve on update
        { new: true, runValidators: true }
      );
    } else {
      // Auto-approve so talent is immediately visible to providers
      profile = await TalentProfile.create({ userId: req.user._id, ...data, profileStatus: 'approved' });
    }

    res.json({ success: true, data: { profile } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Search talent (with filters)
 * @route  GET /api/talent/search
 * @access Public
 */
const searchTalent = async (req, res, next) => {
  try {
    const {
      skill,
      city,
      minRating,
      minRate,
      maxRate,
      page = 1,
      limit = 12,
      sort = '-ratingAvg',
    } = req.query;

    const query = { profileStatus: 'approved' };

    if (skill) {
      query.$or = [
        { primarySkill: { $regex: skill, $options: 'i' } },
        { skills: { $elemMatch: { $regex: skill, $options: 'i' } } },
      ];
    }
    if (minRating) query.ratingAvg = { $gte: parseFloat(minRating) };
    if (minRate) query.hourlyRateMin = { $gte: parseFloat(minRate) };
    if (maxRate) query.hourlyRateMax = { $lte: parseFloat(maxRate) };

    const profiles = await TalentProfile.find(query)
      .populate('userId', 'name profilePicUrl locationCity locationState')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Filter by city (from user's location)
    let results = profiles;
    if (city) {
      results = profiles.filter(
        (p) => p.userId?.locationCity?.toLowerCase().includes(city.toLowerCase()) ||
               p.serviceAreas?.some((a) => a.toLowerCase().includes(city.toLowerCase()))
      );
    }

    const total = await TalentProfile.countDocuments(query);

    res.json({
      success: true,
      data: {
        profiles: results,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get single talent profile
 * @route  GET /api/talent/:id
 * @access Public
 */
const getTalentById = async (req, res, next) => {
  try {
    const profile = await TalentProfile.findById(req.params.id).populate(
      'userId',
      'name email profilePicUrl bio locationCity locationState phone'
    );
    if (!profile) return res.status(404).json({ success: false, message: 'Talent not found' });

    res.json({ success: true, data: { profile } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get my talent profile
 * @route  GET /api/talent/me
 * @access Private (talent)
 */
const getMyProfile = async (req, res, next) => {
  try {
    const profile = await TalentProfile.findOne({ userId: req.user._id }).populate(
      'userId',
      'name email profilePicUrl bio locationCity'
    );
    res.json({ success: true, data: { profile } });
  } catch (error) {
    next(error);
  }
};

module.exports = { upsertProfile, searchTalent, getTalentById, getMyProfile };
