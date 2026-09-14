const express = require('express');
const router = express.Router();
const {
  getMyPartnerOrgProfile,
  getMyPartnerOrgQr,
  getMyBins,
  updateMyBinStatus,
  getPartnerOrgStats,
  createPartnerOrg,
  getAllPartnerOrgs,
  getPartnerOrgById,
  updatePartnerOrg,
  deletePartnerOrg,
} = require('../controllers/partnerOrgController');
const { protect, staffOrAdmin, lgu } = require('../middleware/authMiddleware');

// Partner Organization mobile self workflows
router.get('/me', protect, getMyPartnerOrgProfile);
router.get('/me/qr', protect, lgu, getMyPartnerOrgQr);
router.get('/my-bins', protect, getMyBins);
router.get('/bins', protect, getMyBins);
router.patch('/bins/:binId/status', protect, updateMyBinStatus);
router.get('/stats', protect, getPartnerOrgStats);

// Admin / Staff management routes
router.route('/')
  .post(protect, staffOrAdmin, createPartnerOrg)
  .get(protect, staffOrAdmin, getAllPartnerOrgs);

router.route('/:id')
  .get(protect, staffOrAdmin, getPartnerOrgById)
  .put(protect, staffOrAdmin, updatePartnerOrg)
  .delete(protect, staffOrAdmin, deletePartnerOrg);

module.exports = router;

