const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  officeStartTime: { type: String, default: '09:00' },
  lateCutoffTime: { type: String, default: '09:15' },
  officeEndTime: { type: String, default: '18:00' },
  autoCheckoutTime: { type: String, default: '23:59' },
  weeklyOff: { type: [String], default: ['Friday'] }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);