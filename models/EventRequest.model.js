const mongoose = require('mongoose');

/**
 * EventRequest Model
 * Posted by talent_provider to find talent
 */
const eventRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 2000 },
    skillCategory: { type: String, required: true },
    eventDate: { type: Date, required: true },
    durationHours: { type: Number, min: 0 },
    budgetMin: { type: Number, min: 0 },
    budgetMax: { type: Number, min: 0 },
    location: { type: String },
    status: {
      type: String,
      enum: ['open', 'closed', 'awarded', 'cancelled'],
      default: 'open',
    },
    applications: [
      {
        talentId: { type: mongoose.Schema.Types.ObjectId, ref: 'TalentProfile' },
        proposedRate: { type: Number },
        message: { type: String },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'rejected'],
          default: 'pending',
        },
        appliedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('EventRequest', eventRequestSchema);
