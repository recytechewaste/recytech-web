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

// Register model with both names mapping to the same underlying collection 'lguaccounts'
const PartnerOrganization = mongoose.models.PartnerOrganization || mongoose.model('PartnerOrganization', partnerOrgSchema, 'lguaccounts');
const LguAccount = mongoose.models.LguAccount || mongoose.model('LguAccount', partnerOrgSchema, 'lguaccounts');

module.exports = PartnerOrganization;
module.exports.PartnerOrganization = PartnerOrganization;
module.exports.LguAccount = LguAccount;
