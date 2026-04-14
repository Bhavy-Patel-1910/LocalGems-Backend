const Review = require('../models/Review.model');
const Booking = require('../models/Booking.model');

/**
 * @desc   Create review (only for completed bookings, one per booking)
 * @route  POST /api/reviews
 * @access Private (talent_provider only)
 */
const createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, reviewText } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Only allow review for completed bookings
    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only review completed bookings' });
    }

    // Only booking owner can review
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this booking' });
    }

    // Check if review already exists (unique constraint on bookingId)
    const existing = await Review.findOne({ bookingId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this booking' });
    }

    const review = await Review.create({
      bookingId,
      userId: req.user._id,
      talentId: booking.talentId,
      rating,
      reviewText,
    });

    res.status(201).json({ success: true, data: { review } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get reviews for a talent
 * @route  GET /api/reviews/:talentId
 * @access Public
 */
const getTalentReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ talentId: req.params.talentId })
      .populate('userId', 'name profilePicUrl')
      .sort('-createdAt');

    res.json({ success: true, data: { reviews } });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReview, getTalentReviews };
