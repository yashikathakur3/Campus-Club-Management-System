const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['super_admin', 'member'], default: 'member', required: true },
  studentId: { type: String, trim: true, sparse: true, unique: true },
  department: { type: String, trim: true, maxlength: 120 },
  year: { type: Number, min: 1, max: 6 },
  bio: { type: String, trim: true, maxlength: 500 },
  avatarUrl: { type: String, trim: true, maxlength: 2048 },
  isActive: { type: Boolean, default: true, required: true },
  tokenVersion: { type: Number, default: 0, required: true },
  lastLoginAt: { type: Date },
}, {
  timestamps: true,
  toJSON: {
    transform(_doc, ret) {
      delete ret.passwordHash;
      delete ret.tokenVersion;
      delete ret.__v;
      return ret;
    },
  },
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
