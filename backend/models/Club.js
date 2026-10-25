const mongoose = require('mongoose');

const socialLinksSchema = new mongoose.Schema({
  website: { type: String, trim: true, maxlength: 2048 },
  instagram: { type: String, trim: true, maxlength: 2048 },
  facebook: { type: String, trim: true, maxlength: 2048 },
  linkedin: { type: String, trim: true, maxlength: 2048 },
}, { _id: false, strict: 'throw' });

const clubSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, trim: true, maxlength: 3000, default: '' },
  category: { type: String, enum: ['technical', 'cultural', 'sports', 'academic', 'social_service', 'arts', 'other'], required: true },
  logoUrl: { type: String, trim: true, maxlength: 2048 },
  bannerUrl: { type: String, trim: true, maxlength: 2048 },
  contactEmail: { type: String, trim: true, lowercase: true, maxlength: 254 },
  socialLinks: { type: socialLinksSchema, default: () => ({}) },
  joinPolicy: { type: String, enum: ['open', 'approval'], default: 'approval', required: true },
  isActive: { type: Boolean, default: true, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  memberCount: { type: Number, default: 0, min: 0, required: true },
}, { timestamps: true });

clubSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
clubSchema.index({ name: 'text', description: 'text' });
clubSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.models.Club || mongoose.model('Club', clubSchema);
