const express = require('express');
const router = express.Router();
const {
  createBin,
  getAllBins,
  getBinById,
  updateBin,
  deleteBin,
} = require('../controllers/binController');
const { protect, staffOnlyOrSuperAdmin } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, staffOnlyOrSuperAdmin, createBin)
  .get(protect, staffOnlyOrSuperAdmin, getAllBins);

router.route('/:id')
  .get(protect, staffOnlyOrSuperAdmin, getBinById)
  .put(protect, staffOnlyOrSuperAdmin, updateBin)
  .delete(protect, staffOnlyOrSuperAdmin, deleteBin);

module.exports = router;
