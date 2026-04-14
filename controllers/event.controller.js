const EventRequest = require('../models/EventRequest.model');
const TalentProfile = require('../models/TalentProfile.model');

/**
 * @desc   Post an event/gig request
 * @route  POST /api/events
 * @access Private (talent_provider)
 */
const createEvent = async (req, res, next) => {
  try {
    const event = await EventRequest.create({ userId: req.user._id, ...req.body });
    res.status(201).json({ success: true, data: { event } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get all open events
 * @route  GET /api/events
 * @access Public/Private
 */
const getEvents = async (req, res, next) => {
  try {
    const { skill, page = 1, limit = 10 } = req.query;
    const query = { status: 'open' };
    if (skill) query.skillCategory = { $regex: skill, $options: 'i' };

    const events = await EventRequest.find(query)
      .populate('userId', 'name locationCity profilePicUrl')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await EventRequest.countDocuments(query);
    res.json({
      success: true,
      data: { events, pagination: { page: parseInt(page), total, pages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Talent applies to an event
 * @route  POST /api/events/:id/apply
 * @access Private (talent)
 */
const applyToEvent = async (req, res, next) => {
  try {
    const event = await EventRequest.findById(req.params.id);
    if (!event || event.status !== 'open') {
      return res.status(404).json({ success: false, message: 'Event not found or closed' });
    }

    const talentProfile = await TalentProfile.findOne({ userId: req.user._id });
    if (!talentProfile) return res.status(400).json({ success: false, message: 'Complete your talent profile first' });

    const alreadyApplied = event.applications.find(
      (a) => a.talentId.toString() === talentProfile._id.toString()
    );
    if (alreadyApplied) {
      return res.status(400).json({ success: false, message: 'Already applied to this event' });
    }

    event.applications.push({
      talentId: talentProfile._id,
      proposedRate: req.body.proposedRate,
      message: req.body.message,
    });
    await event.save();

    res.json({ success: true, message: 'Application submitted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get my events (talent_provider)
 * @route  GET /api/events/my
 * @access Private
 */
const getMyEvents = async (req, res, next) => {
  try {
    const events = await EventRequest.find({ userId: req.user._id }).sort('-createdAt');
    res.json({ success: true, data: { events } });
  } catch (error) {
    next(error);
  }
};

module.exports = { createEvent, getEvents, applyToEvent, getMyEvents };
