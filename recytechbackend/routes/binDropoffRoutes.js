const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    createDropoff, 
    createPublicDropoff, 
    getDropoffs,
    getDropoffById,
    validateDropoff
} = require('../controllers/binDropoffController');

// Dropoff collection list and creation
router.route('/')
    .get(protect, getDropoffs)
    .post(protect, createDropoff);

// Public/Guest dropoff submission
router.post('/public', createPublicDropoff);

// Dropoff validation (Approve/Reject by Partner Org or Admin)
router.route('/:id/validate')
    .patch(protect, validateDropoff)
    .post(protect, validateDropoff);

// Single dropoff retrieval
router.route('/:id')
    .get(protect, getDropoffById);

module.exports = router;

