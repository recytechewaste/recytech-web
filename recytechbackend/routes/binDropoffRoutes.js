const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createDropoff, createPublicDropoff, getDropoffs } = require('../controllers/binDropoffController');

router.get('/', protect, getDropoffs);
router.post('/', protect, createDropoff);
router.post('/public', createPublicDropoff);

module.exports = router;
