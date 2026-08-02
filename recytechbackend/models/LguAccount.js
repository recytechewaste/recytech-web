const mongoose = require('mongoose');

const lguAccountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true, select: false },
  jurisdiction: { type: String },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
  assignedBins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bin',
  }],
}, { timestamps: true });

module.exports = mongoose.model('LguAccount', lguAccountSchema);
