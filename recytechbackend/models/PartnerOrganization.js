const mongoose = require('mongoose');

const partnerOrgSchema = new mongoose.Schema({
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

// Single model registration — 'PartnerOrganization' is the canonical name.
// RecyclingCenter.assignedLgu uses ref: 'PartnerOrganization' so this must match exactly.
const PartnerOrganization = mongoose.models.PartnerOrganization
  || mongoose.model('PartnerOrganization', partnerOrgSchema, 'lguaccounts');

// LguAccount is an alias — points to the exact same model instance (no second registration)
module.exports = PartnerOrganization;
module.exports.PartnerOrganization = PartnerOrganization;
module.exports.LguAccount = PartnerOrganization; // alias, not a separate model
