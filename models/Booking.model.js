const mongoose = require('mongoose');

/**
 * Booking Model
 * talent_provider books a talent for an event
 */
const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    talentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TalentProfile',
      required: true,
    },
    eventTitle: { type: String, trim: true },
    eventDateStart: { type: Date, required: [true, 'Start date is required'] },
    eventDateEnd: { type: Date },
    durationHours: { type: Number, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'],
      default: 'pending',
    },
    amountAgreed: { type: Number, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    stripePaymentIntentId: { type: String },
    notes: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

// Index for conflict detection
bookingSchema.index({ talentId: 1, eventDateStart: 1, eventDateEnd: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
