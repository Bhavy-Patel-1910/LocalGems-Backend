const Booking = require('../models/Booking.model');
const TalentProfile = require('../models/TalentProfile.model');

/**
 * @desc   Create booking (with double-booking prevention)
 * @route  POST /api/bookings
 * @access Private (talent_provider only)
 */
const createBooking = async (req, res, next) => {
  try {
    const { talentId, eventTitle, eventDateStart, eventDateEnd, durationHours, amountAgreed, notes } = req.body;

    const talent = await TalentProfile.findById(talentId);
    if (!talent || talent.profileStatus !== 'approved') {
      return res.status(404).json({ success: false, message: 'Talent not found or not available' });
    }

    // ─── Double-booking conflict check ──────────────────────────────────────────
    const conflict = await Booking.findOne({
      talentId,
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        {
          eventDateStart: { $lt: new Date(eventDateEnd || eventDateStart) },
          eventDateEnd: { $gt: new Date(eventDateStart) },
        },
        {
          eventDateStart: { $lte: new Date(eventDateStart) },
          eventDateEnd: { $gte: new Date(eventDateEnd || eventDateStart) },
        },
      ],
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'Talent is already booked for this time slot. Please choose a different date/time.',
      });
    }

    const booking = await Booking.create({
      userId: req.user._id,
      talentId,
      eventTitle,
      eventDateStart,
      eventDateEnd,
      durationHours,
      amountAgreed,
      notes,
    });

    res.status(201).json({ success: true, data: { booking } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Update booking status
 * @route  PUT /api/bookings/:id/status
 * @access Private
 */
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Talent can confirm/reject/complete; client can cancel
    const talentProfile = await TalentProfile.findById(booking.talentId);
    const isTalent = talentProfile?.userId.toString() === req.user._id.toString();
    const isClient = booking.userId.toString() === req.user._id.toString();

    if (isTalent && !['confirmed', 'rejected', 'completed'].includes(status)) {
      return res.status(403).json({ success: false, message: 'Talent cannot set this status' });
    }
    if (isClient && status !== 'cancelled') {
      return res.status(403).json({ success: false, message: 'Client can only cancel bookings' });
    }
    if (!isTalent && !isClient) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    booking.status = status;
    await booking.save();

    res.json({ success: true, data: { booking } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get bookings for current user (client or talent)
 * @route  GET /api/bookings/user
 * @access Private
 */
const getUserBookings = async (req, res, next) => {
  try {
    let bookings;
    if (req.user.role === 'talent_provider') {
      bookings = await Booking.find({ userId: req.user._id })
        .populate({ path: 'talentId', populate: { path: 'userId', select: 'name profilePicUrl' } })
        .sort('-createdAt');
    } else {
      const profile = await TalentProfile.findOne({ userId: req.user._id });
      if (!profile) return res.json({ success: true, data: { bookings: [] } });
      bookings = await Booking.find({ talentId: profile._id })
        .populate('userId', 'name profilePicUrl email phone')
        .sort('-createdAt');
    }
    res.json({ success: true, data: { bookings } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get single booking
 * @route  GET /api/bookings/:id
 * @access Private
 */
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'name email phone profilePicUrl')
      .populate({ path: 'talentId', populate: { path: 'userId', select: 'name profilePicUrl' } });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    res.json({ success: true, data: { booking } });
  } catch (error) {
    next(error);
  }
};

module.exports = { createBooking, updateBookingStatus, getUserBookings, getBookingById };
