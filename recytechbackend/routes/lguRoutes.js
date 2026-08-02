const express = require('express');
const router = express.Router();
const {
  createLguAccount,
  getAllLguAccounts,
  getLguAccountById,
  updateLguAccount,
  deleteLguAccount,
} = require('../controllers/lguController');
const { protect, admin, staffOrAdmin } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, admin, createLguAccount)
  .get(protect, staffOrAdmin, getAllLguAccounts);

router.route('/:id')
  .get(protect, staffOrAdmin, getLguAccountById)
  .put(protect, admin, updateLguAccount)
  .delete(protect, admin, deleteLguAccount);

module.exports = router;
