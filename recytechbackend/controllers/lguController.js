const LguAccount = require('../models/LguAccount');
const { asyncHandler } = require('../utils/asyncHandler');
const bcrypt = require('bcryptjs');
const Request = require('../models/Request');
const User = require('../models/User');
const Bin = require('../models/Bin');
const RecyclingCenter = require('../models/RecyclingCenter');

// @desc    Create a new LGU account
// @route   POST /api/lgus
// @access  Private/Admin
const createLguAccount = asyncHandler(async (req, res) => {
  const { name, contactPerson, email, phone, password, jurisdiction, status } = req.body;

  const lguExists = await LguAccount.findOne({ email });

  if (lguExists) {
    res.status(400);
    throw new Error('LGU account with that email already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const lguAccount = await LguAccount.create({
    name,
    contactPerson,
    email,
    phone,
    password: hashedPassword,
    jurisdiction,
    status,
  });

  if (lguAccount) {
    res.status(201).json({
      _id: lguAccount._id,
      name: lguAccount.name,
      email: lguAccount.email,
      status: lguAccount.status,
    });
  } else {
    res.status(400);
    throw new Error('Invalid LGU account data');
  }
});

// @desc    Get all LGU accounts
// @route   GET /api/lgus
// @access  Private/Admin
const getAllLguAccounts = asyncHandler(async (req, res) => {
  const lguAccounts = await LguAccount.find({}).lean();
  const allBins = await RecyclingCenter.find({ assignedLgu: { $exists: true, $ne: null } })
    .select('name address qrCode capacityKg currentFillKg status assignedLgu location')
    .lean();

  const lguAccountsWithBins = lguAccounts.map(lgu => {
    const assignedBins = allBins.filter(b => b.assignedLgu && b.assignedLgu.toString() === lgu._id.toString());
    return {
      ...lgu,
      assignedBins
    };
  });

  res.json(lguAccountsWithBins);
});

// @desc    Get LGU account by ID
// @route   GET /api/lgus/:id
// @access  Private/Admin
const getLguAccountById = asyncHandler(async (req, res) => {
  const lguAccount = await LguAccount.findById(req.params.id).lean();

  if (lguAccount) {
    const assignedBins = await RecyclingCenter.find({ assignedLgu: req.params.id })
      .select('name address qrCode capacityKg currentFillKg status location')
      .lean();
    res.json({
      ...lguAccount,
      assignedBins
    });
  } else {
    res.status(404);
    throw new Error('LGU account not found');
  }
});

// @desc    Update LGU account
// @route   PUT /api/lgus/:id
// @access  Private/Admin
const updateLguAccount = asyncHandler(async (req, res) => {
  const lguAccount = await LguAccount.findById(req.params.id);

  if (lguAccount) {
    lguAccount.name = req.body.name || lguAccount.name;
    lguAccount.contactPerson = req.body.contactPerson || lguAccount.contactPerson;
    lguAccount.email = req.body.email || lguAccount.email;
    lguAccount.phone = req.body.phone || lguAccount.phone;
    lguAccount.jurisdiction = req.body.jurisdiction || lguAccount.jurisdiction;
    lguAccount.status = req.body.status || lguAccount.status;
    
    if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        lguAccount.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedLguAccount = await lguAccount.save();
    res.json(updatedLguAccount);
  } else {
    res.status(404);
    throw new Error('LGU account not found');
  }
});

// @desc    Delete LGU account
// @route   DELETE /api/lgus/:id
// @access  Private/Admin
const deleteLguAccount = asyncHandler(async (req, res) => {
  const lguAccount = await LguAccount.findById(req.params.id);
 
  if (!lguAccount) {
    res.status(404);
    throw new Error('LGU account not found');
  }

  // Find the corresponding User account via email to correctly check for associated requests.
  // The Request model stores the User's ID, not the LguAccount ID.
  const lguUser = await User.findOne({ email: lguAccount.email });

  // Business Logic: Prevent deactivation if there are active, non-completed requests.
  if (lguUser) {
    const activeRequests = await Request.findOne({
      lgu: lguUser._id, // Check using the User's ID
      status: { $in: ['Pending', 'Scheduled', 'In-Transit', 'In-Progress'] }
    });

    if (activeRequests) {
      res.status(400);
      throw new Error('This LGU has active collection requests and cannot be deactivated. Please resolve them first.');
    }
  }

  // Soft-delete the LGU account
  lguAccount.status = 'Inactive';
  await lguAccount.save();

  // Also deactivate the associated User login account for consistency
  if (lguUser) {
    lguUser.status = 'Inactive';
    await lguUser.save();
  }

  // Cascade update to unassign associated bins
  await Bin.updateMany(
    { assignedLgu: lguAccount._id },
    { $set: { assignedLgu: null, status: 'Unassigned' } }
  );

  res.json({ message: 'LGU account and associated login have been deactivated. Associated bins are now unassigned.' });
});


module.exports = {
  createLguAccount,
  getAllLguAccounts,
  getLguAccountById,
  updateLguAccount,
  deleteLguAccount,
};