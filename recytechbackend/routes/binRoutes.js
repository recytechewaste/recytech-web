const express = require('express');
const router = express.Router();
const {
  createBin,
  getAllBins,
  getBinById,
  updateBin,
  deleteBin,
} = require('../controllers/binController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, admin, createBin)
  .get(getAllBins);

router.route('/:id')
  .get(getBinById)
  .put(protect, admin, updateBin)
  .delete(protect, admin, deleteBin);

module.exports = router;
