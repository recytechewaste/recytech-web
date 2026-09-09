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
  .get(getAllBins);

router.route('/:id')
  .get(getBinById)
  .put(protect, staffOnlyOrSuperAdmin, updateBin)
  .delete(protect, staffOnlyOrSuperAdmin, deleteBin);

module.exports = router;
