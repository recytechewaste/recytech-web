const express = require('express');
const router = express.Router();
const {
  createLguAccount,
  getAllLguAccounts,
  getLguAccountById,
  updateLguAccount,
  deleteLguAccount,
} = require('../controllers/lguController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes in this file are protected and require admin privileges.
router.use(protect, admin);

router.route('/')
  .post(createLguAccount)
  .get(getAllLguAccounts);

router.route('/:id')
  .get(getLguAccountById)
  .put(updateLguAccount)
  .delete(deleteLguAccount);

module.exports = router;
