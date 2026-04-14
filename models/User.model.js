const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Model
 * Roles: 'talent' (performer/provider) | 'talent_provider' (client/organizer)
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never return password in queries
    },
    role: {
      type: String,
      enum: ['talent', 'talent_provider'],
      required: [true, 'Role is required'],
    },
    phone: {
      type: String,
      trim: true,
    },
    locationCity: String,
    locationState: String,
    locationCountry: { type: String, default: 'India' },
    latitude: { type: Number },
    longitude: { type: Number },
    profilePicUrl: { type: String, default: '' },
    bio: { type: String, maxlength: 500 },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // Password reset fields
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },

    // Refresh token
    refreshToken: { type: String, select: false },
  },
  { timestamps: true }
);

// ─── Hash password before saving ──────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance methods ──────────────────────────────────────────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  delete obj.refreshToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
