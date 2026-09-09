const PartnerOrganization = require('../models/PartnerOrganization');
const { asyncHandler } = require('../utils/asyncHandler');
const bcrypt = require('bcryptjs');
const Request = require('../models/Request');
const User = require('../models/User');
const Bin = require('../models/Bin');
const RecyclingCenter = require('../models/RecyclingCenter');
const BinDropoff = require('../models/BinDropoff');
const { getProfileForUser, normalizeRole, CANONICAL_ROLES } = require('../utils/roleHelper');
const mongoose = require('mongoose');

// @desc    Get logged in Partner Organization's profile and dashboard overview
// @route   GET /api/partner-organizations/me
// @access  Private/Partner Org
const getMyPartnerOrgProfile = asyncHandler(async (req, res) => {
  const { profileId, profile } = await getProfileForUser(req.user._id, req.user.role);

  if (!profileId || !profile) {
    res.status(404);
    throw new Error('Partner Organization profile not found for this user account.');
  }

  // Fetch assigned bins
  let assignedBins = await RecyclingCenter.find({ assignedLgu: profileId })
    .select('name address qrCode qrCodeImage capacityKg currentFillKg status location')
    .lean();

  if (!assignedBins || assignedBins.length === 0) {
    assignedBins = await Bin.find({ assignedLgu: profileId }).lean();
  }

  const assignedBinIds = assignedBins.map(b => b._id);

  // Compute dashboard counters
  const pendingDropoffsCount = await BinDropoff.countDocuments({
    binId: { $in: assignedBinIds },
    status: { $in: ['pending', 'Pending'] }
  });

  const validatedDropoffsCount = await BinDropoff.countDocuments({
    binId: { $in: assignedBinIds },
    status: { $in: ['approved', 'Approved'] }
  });

  const activeRequestsCount = await Request.countDocuments({
    lgu: profileId,
    status: {
      $in: [
        'pending', 'Pending',
        'scheduled', 'Scheduled',
        'assigned', 'Assigned',
        'in_progress', 'in-progress', 'In-Progress', 'In Progress',
        'in_transit', 'in-transit', 'In-Transit', 'In Transit',
        'arrived', 'Arrived'
      ]
    }
  });

  res.json({
    profile,
    user: {
      _id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
      status: req.user.status
    },
    assignedBins,
    stats: {
      assignedBinsCount: assignedBins.length,
      pendingDropoffsCount,
      validatedDropoffsCount,
      activeRequestsCount
    }
  });
});

// @desc    Get bins assigned to logged-in Partner Organization
// @route   GET /api/partner-organizations/my-bins
// @access  Private/Partner Org
const getMyBins = asyncHandler(async (req, res) => {
  const { profileId } = await getProfileForUser(req.user._id, req.user.role);

  if (!profileId) {
    res.status(404);
    throw new Error('Partner Organization profile not found.');
  }

  let assignedBins = await RecyclingCenter.find({ assignedLgu: profileId })
    .populate('assignedCollector', 'firstName lastName phone vehiclePlate')
    .sort({ createdAt: -1 })
    .lean();

  if (!assignedBins || assignedBins.length === 0) {
    assignedBins = await Bin.find({ assignedLgu: profileId })
      .sort({ createdAt: -1 })
      .lean();
  }

  res.json({
    success: true,
    totalBins: assignedBins.length,
    bins: assignedBins
  });
});

// @desc    Update status/condition of an assigned bin (Partner Org)
// @route   PATCH /api/partner-organizations/bins/:binId/status
// @access  Private/Partner Org
const updateMyBinStatus = asyncHandler(async (req, res) => {
  const { binId } = req.params;
  const { status, fillLevel, currentFillKg, notes } = req.body;

  if (!status) {
    res.status(400);
    throw new Error('status is required ("Operational", "Full", or "Maintenance")');
  }

  const { profileId } = await getProfileForUser(req.user._id, req.user.role);
  if (!profileId) {
    res.status(404);
    throw new Error('Partner Organization profile not found.');
  }

  // Try to find in RecyclingCenter first, then Bin
  let binDoc = await RecyclingCenter.findById(binId);
  let isRecyclingCenter = true;

  if (!binDoc) {
    binDoc = await Bin.findById(binId);
    isRecyclingCenter = false;
  }

  if (!binDoc) {
    res.status(404);
    throw new Error('Bin not found');
  }

  // Verify ownership
  if (binDoc.assignedLgu && binDoc.assignedLgu.toString() !== profileId.toString()) {
    res.status(403);
    throw new Error('Forbidden: You can only update bins assigned to your organization.');
  }

  binDoc.status = status;
  if (fillLevel !== undefined) binDoc.fillLevel = Number(fillLevel);
  if (currentFillKg !== undefined) binDoc.currentFillKg = Number(currentFillKg);
  // NOTE: `notes` from a bin-status update must NOT be written into RecyclingCenter.description.
  // description is a permanent administrative field, not a status-update log.
  // SensorReport.issueDescription is the correct field for incident/status notes.

  await binDoc.save();

  res.json({
    success: true,
    message: `Bin status updated to ${status}.`,
    bin: binDoc
  });
});

// @desc    Get Partner Organization community impact & verification statistics
// @route   GET /api/partner-organizations/stats
// @access  Private (Partner Org, Admin, Staff)
const getPartnerOrgStats = asyncHandler(async (req, res) => {
  let targetLguId = null;

  const userRole = normalizeRole(req.user.role);
  if (userRole === CANONICAL_ROLES.PARTNER_ORG) {
    const { profileId } = await getProfileForUser(req.user._id, req.user.role);
    targetLguId = profileId;
  } else if (req.query.partnerOrgId) {
    targetLguId = req.query.partnerOrgId;
  }

  if (!targetLguId) {
    res.status(400);
    throw new Error('Partner Organization ID could not be determined.');
  }

  // Find bins assigned to this LGU
  const assignedBins = await RecyclingCenter.find({ assignedLgu: targetLguId }).select('_id');
  const assignedBinIds = assignedBins.map(b => b._id);

  // Aggregation of approved drop-offs for this partner org's bins
  const approvedDropoffs = await BinDropoff.find({
    binId: { $in: assignedBinIds },
    status: { $in: ['approved', 'Approved'] }
  });

  let totalPointsDistributed = 0;
  let totalItemsReceived = 0;
  const categoryBreakdown = {};

  approvedDropoffs.forEach(d => {
    totalPointsDistributed += (d.pointsAwarded || 0);
    const count = d.quantity || d.kilograms || 1;
    totalItemsReceived += count;
    categoryBreakdown[d.wasteType] = (categoryBreakdown[d.wasteType] || 0) + count;
  });

  const pendingValidationsCount = await BinDropoff.countDocuments({
    binId: { $in: assignedBinIds },
    status: { $in: ['pending', 'Pending'] }
  });

  const completedRequestsCount = await Request.countDocuments({
    lgu: targetLguId,
    status: { $in: ['completed', 'Completed'] }
  });

  res.json({
    partnerOrgId: targetLguId,
    assignedBinsCount: assignedBinIds.length,
    pendingValidations: pendingValidationsCount,
    totalDropoffsValidated: approvedDropoffs.length,
    totalPointsDistributed,
    totalItemsReceived,
    completedCollections: completedRequestsCount,
    categoryBreakdown
  });
});

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

// @desc    Get all Partner Organizations (Admin/Staff view)
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
  getMyPartnerOrgProfile,
  getMyBins,
  updateMyBinStatus,
  getPartnerOrgStats,
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

