const PartnerOrganization = require('../models/PartnerOrganization');
const { asyncHandler } = require('../utils/asyncHandler');
const bcrypt = require('bcryptjs');
const Request = require('../models/Request');
const User = require('../models/User');
const Bin = require('../models/Bin');
const RecyclingCenter = require('../models/RecyclingCenter');

// @desc    Create a new Partner Organization account
// @route   POST /api/partner-organizations
// @access  Private/Admin
const createPartnerOrg = asyncHandler(async (req, res) => {
  const { name, contactPerson, email, phone, password, jurisdiction, status } = req.body;

  const orgExists = await PartnerOrganization.findOne({ email });

  if (orgExists) {
    res.status(400);
    throw new Error('Partner organization with that email already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const partnerOrg = await PartnerOrganization.create({
    name,
    contactPerson,
    email,
    phone,
    password: hashedPassword,
    jurisdiction,
    status,
  });

  if (partnerOrg) {
    res.status(201).json({
      _id: partnerOrg._id,
      name: partnerOrg.name,
      email: partnerOrg.email,
      status: partnerOrg.status,
    });
  } else {
    res.status(400);
    throw new Error('Invalid partner organization data');
  }
});

// @desc    Get all Partner Organizations
// @route   GET /api/partner-organizations
// @access  Private/Staff/Admin
const getAllPartnerOrgs = asyncHandler(async (req, res) => {
  const partnerOrgs = await PartnerOrganization.find({}).lean();
  const allBins = await RecyclingCenter.find({ assignedLgu: { $exists: true, $ne: null } })
    .select('name address qrCode qrCodeImage capacityKg currentFillKg status assignedLgu location')
    .lean();

  const orgsWithBins = partnerOrgs.map(org => {
    const assignedBins = allBins.filter(b => b.assignedLgu && b.assignedLgu.toString() === org._id.toString());
    return {
      ...org,
      assignedBins
    };
  });

  res.json(orgsWithBins);
});

// @desc    Get Partner Organization by ID
// @route   GET /api/partner-organizations/:id
// @access  Private/Staff/Admin
const getPartnerOrgById = asyncHandler(async (req, res) => {
  const partnerOrg = await PartnerOrganization.findById(req.params.id).lean();

  if (partnerOrg) {
    const assignedBins = await RecyclingCenter.find({ assignedLgu: req.params.id })
      .select('name address qrCode qrCodeImage capacityKg currentFillKg status location')
      .lean();
    res.json({
      ...partnerOrg,
      assignedBins
    });
  } else {
    res.status(404);
    throw new Error('Partner organization not found');
  }
});

// @desc    Update Partner Organization
// @route   PUT /api/partner-organizations/:id
// @access  Private/Admin
const updatePartnerOrg = asyncHandler(async (req, res) => {
  const partnerOrg = await PartnerOrganization.findById(req.params.id);

  if (partnerOrg) {
    partnerOrg.name = req.body.name || partnerOrg.name;
    partnerOrg.contactPerson = req.body.contactPerson || partnerOrg.contactPerson;
    partnerOrg.email = req.body.email || partnerOrg.email;
    partnerOrg.phone = req.body.phone || partnerOrg.phone;
    partnerOrg.jurisdiction = req.body.jurisdiction || partnerOrg.jurisdiction;
    partnerOrg.status = req.body.status || partnerOrg.status;
    
    if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        partnerOrg.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedOrg = await partnerOrg.save();
    res.json(updatedOrg);
  } else {
    res.status(404);
    throw new Error('Partner organization not found');
  }
});

// @desc    Delete / Deactivate Partner Organization
// @route   DELETE /api/partner-organizations/:id
// @access  Private/Admin
const deletePartnerOrg = asyncHandler(async (req, res) => {
  const partnerOrg = await PartnerOrganization.findById(req.params.id);
 
  if (!partnerOrg) {
    res.status(404);
    throw new Error('Partner organization not found');
  }

  // Find the corresponding User account via email to check for associated requests.
  const orgUser = await User.findOne({ email: partnerOrg.email });

  if (orgUser) {
    const activeRequests = await Request.findOne({
      lgu: orgUser._id,
      status: { $in: ['Pending', 'Scheduled', 'In-Transit', 'In-Progress'] }
    });

    if (activeRequests) {
      res.status(400);
      throw new Error('This partner organization has active collection requests and cannot be deactivated. Please resolve them first.');
    }
  }

  // Soft-delete the partner organization
  partnerOrg.status = 'Inactive';
  await partnerOrg.save();

  // Also deactivate the associated User login account for consistency
  if (orgUser) {
    orgUser.status = 'Inactive';
    await orgUser.save();
  }

  // Cascade update to unassign associated bins
  await Bin.updateMany(
    { assignedLgu: partnerOrg._id },
    { $set: { assignedLgu: null, status: 'Unassigned' } }
  );

  res.json({ message: 'Partner organization and associated login have been deactivated. Associated bins are now unassigned.' });
});

module.exports = {
  createPartnerOrg,
  getAllPartnerOrgs,
  getPartnerOrgById,
  updatePartnerOrg,
  deletePartnerOrg,
  // Backward compatibility
  createLguAccount: createPartnerOrg,
  getAllLguAccounts: getAllPartnerOrgs,
  getLguAccountById: getPartnerOrgById,
  updateLguAccount: updatePartnerOrg,
  deleteLguAccount: deletePartnerOrg,
};
