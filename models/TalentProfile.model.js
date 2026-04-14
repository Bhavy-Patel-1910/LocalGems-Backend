const mongoose = require('mongoose');

/**
 * TalentProfile Model
 * One profile per talent user (role = 'talent')
 */
const talentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    primarySkill: {
      type: String,
      required: [true, 'Primary skill is required'],
      trim: true,
    },
    skills: [{ type: String, trim: true }], // e.g. ["Bollywood", "Classical"]
    experienceYears: { type: Number, default: 0, min: 0 },
    experienceDesc: { type: String, maxlength: 2000 },
    portfolioUrls: [{ type: String }], // YouTube, images, SoundCloud
    hourlyRateMin: { type: Number, min: 0 },
    hourlyRateMax: { type: Number, min: 0 },
    availability: {
      // e.g. { monday: ["09:00-12:00", "14:00-18:00"], ... }
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    serviceAreas: [{ type: String }], // cities or regions
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    profileStatus: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

// Index for search
talentProfileSchema.index({ primarySkill: 'text', skills: 'text' });
talentProfileSchema.index({ profileStatus: 1, isFeatured: -1, ratingAvg: -1 });

module.exports = mongoose.model('TalentProfile', talentProfileSchema);
