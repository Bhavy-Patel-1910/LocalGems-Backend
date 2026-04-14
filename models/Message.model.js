const mongoose = require('mongoose');

/**
 * Message Model
 * Direct messages between talent & talent_provider
 */
const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Message cannot be empty'],
      maxlength: 2000,
    },
    seen: { type: Boolean, default: false },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    }, // optional: link to booking context
  },
  { timestamps: true }
);

// Index for efficient conversation retrieval
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
