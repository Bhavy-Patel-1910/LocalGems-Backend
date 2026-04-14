const mongoose = require('mongoose');

/**
 * Review Model
 * One review per completed booking
 */
const reviewSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true, // One review per booking
    },
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
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    reviewText: { type: String, maxlength: 1000 },
    isVerified: { type: Boolean, default: true }, // True = tied to real booking
  },
  { timestamps: true }
);

// After saving a review, update talentProfile ratingAvg
reviewSchema.post('save', async function () {
  const TalentProfile = mongoose.model('TalentProfile');
  const reviews = await mongoose.model('Review').find({ talentId: this.talentId });
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await TalentProfile.findByIdAndUpdate(this.talentId, {
    ratingAvg: Math.round(avg * 10) / 10,
    ratingCount: reviews.length,
  });
});

module.exports = mongoose.model('Review', reviewSchema);
