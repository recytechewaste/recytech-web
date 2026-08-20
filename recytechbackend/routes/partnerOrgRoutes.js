const express = require('express');
const router = express.Router();
const {
  createPartnerOrg,
  getAllPartnerOrgs,
  getPartnerOrgById,
  updatePartnerOrg,
  deletePartnerOrg,
} = require('../controllers/partnerOrgController');
const { protect, admin, staffOrAdmin } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, admin, createPartnerOrg)
  .get(protect, staffOrAdmin, getAllPartnerOrgs);

router.route('/:id')
  .get(protect, staffOrAdmin, getPartnerOrgById)
  .put(protect, admin, updatePartnerOrg)
  .delete(protect, admin, deletePartnerOrg);

module.exports = router;
