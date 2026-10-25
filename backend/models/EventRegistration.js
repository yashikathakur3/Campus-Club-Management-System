const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['registered', 'cancelled', 'waitlisted'], default: 'registered', required: true },
  registeredAt: { type: Date, default: Date.now, required: true },
  cancelledAt: { type: Date },
}, { timestamps: true });

eventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });
eventRegistrationSchema.index({ user: 1, status: 1 });
eventRegistrationSchema.index({ event: 1, status: 1 });

module.exports = mongoose.models.EventRegistration || mongoose.model('EventRegistration', eventRegistrationSchema);
