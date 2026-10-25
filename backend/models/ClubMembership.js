const mongoose = require('mongoose');

const clubMembershipSchema = new mongoose.Schema({
  club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clubRole: { type: String, enum: ['member', 'coordinator', 'president'], default: 'member', required: true },
  status: { type: String, enum: ['pending', 'active', 'rejected', 'left', 'removed'], default: 'pending', required: true },
  message: { type: String, trim: true, maxlength: 500, default: '' },
  requestedAt: { type: Date, default: Date.now, required: true },
  decidedAt: { type: Date },
  decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  canAnnounce: { type: Boolean, default: false, required: true },
}, { timestamps: true });

clubMembershipSchema.index({ club: 1, user: 1 }, { unique: true });
clubMembershipSchema.index({ club: 1, status: 1 });
clubMembershipSchema.index({ user: 1, status: 1 });
clubMembershipSchema.index({ club: 1 }, { unique: true, partialFilterExpression: { clubRole: 'president', status: 'active' } });

module.exports = mongoose.models.ClubMembership || mongoose.model('ClubMembership', clubMembershipSchema);
