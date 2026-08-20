const mongoose = require('mongoose');

const binSchema = new mongoose.Schema({
  binId: { type: String, unique: true, required: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  address: { type: String },
  status: {
    type: String,
    enum: ['Operational', 'Full', 'Maintenance'],
    default: 'Operational',
  },
  fillLevel: { type: Number, min: 0, max: 100 },
  assignedLgu: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PartnerOrganization',
  },
}, { timestamps: true });

binSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Bin', binSchema);
