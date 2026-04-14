const Message = require('../models/Message.model');
const User = require('../models/User.model');

/**
 * @desc   Get conversation between two users
 * @route  GET /api/messages/:userId
 * @access Private
 */
const getConversation = async (req, res, next) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.user._id, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: req.user._id },
      ],
    }).sort('createdAt');

    // Mark messages as seen
    await Message.updateMany(
      { senderId: req.params.userId, receiverId: req.user._id, seen: false },
      { seen: true }
    );

    res.json({ success: true, data: { messages } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Send a message
 * @route  POST /api/messages
 * @access Private
 */
const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, message, bookingId } = req.body;
    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ success: false, message: 'Recipient not found' });

    const msg = await Message.create({
      senderId: req.user._id,
      receiverId,
      message,
      bookingId: bookingId || null,
    });

    // Emit via socket (socket util handles this)
    const io = req.app.get('io');
    if (io) {
      io.to(receiverId.toString()).emit('new_message', msg);
    }

    res.status(201).json({ success: true, data: { message: msg } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get all conversation partners
 * @route  GET /api/messages
 * @access Private
 */
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get latest message per conversation
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$senderId', userId] }, '$receiverId', '$senderId'],
          },
          lastMessage: { $first: '$$ROOT' },
          unread: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$receiverId', userId] }, { $eq: ['$seen', false] }] }, 1, 0],
            },
          },
        },
      },
    ]);

    // Populate user info
    const populated = await Promise.all(
      messages.map(async (m) => {
        const user = await User.findById(m._id).select('name profilePicUrl role');
        return { user, lastMessage: m.lastMessage, unread: m.unread };
      })
    );

    res.json({ success: true, data: { conversations: populated } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getConversation, sendMessage, getConversations };
