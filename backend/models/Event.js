const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  title: { type: String, trim: true, required: true, minlength: 3, maxlength: 160 },
  description: { type: String, trim: true, required: true, maxlength: 10000 },
  category: { type: String, enum: ['workshop', 'competition', 'social', 'meeting', 'talk', 'other'], required: true },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true, validate: { validator(value) { return !this.startsAt || value > this.startsAt; }, message: 'Event end must be after its start' } },
  location: { type: String, trim: true, required: true, maxlength: 240 },
  capacity: { type: Number, required: true, min: 1, validate: { validator: Number.isInteger, message: 'Capacity must be an integer' } },
  registeredCount: { type: Number, default: 0, min: 0, required: true },
  registrationDeadline: { type: Date, required: true },
  posterUrl: { type: String, trim: true, maxlength: 2048 },
  status: { type: String, enum: ['draft', 'published', 'cancelled', 'completed'], default: 'draft', required: true },
  visibility: { type: String, enum: ['public', 'members_only'], default: 'public', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coordinators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

eventSchema.index({ club: 1, startsAt: 1 });
eventSchema.index({ status: 1, startsAt: 1 });
eventSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.models.Event || mongoose.model('Event', eventSchema);
