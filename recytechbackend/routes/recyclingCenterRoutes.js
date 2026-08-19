const express = require('express');
const router = express.Router();
const { protect, staffOnlyOrSuperAdmin } = require('../middleware/authMiddleware');
const { 
    getCenters,
    getCenterByQrCode,
    getPublicCenterByQrCode,
    createCenter,
    updateCenter,
    deleteCenter 
} = require('../controllers/recyclingCenterController');

// @desc    Get all centers
// @route   GET /api/bin-locations
router.get('/', protect, staffOnlyOrSuperAdmin, getCenters);

// @desc    Get a center by QR code
// @route   GET /api/bin-locations/qr/:qrCode
router.get('/qr/:qrCode', protect, staffOnlyOrSuperAdmin, getCenterByQrCode);

// @desc    Get a center by QR code for the resident mobile flow
// @route   GET /api/bin-locations/public/qr/:qrCode
router.get('/public/qr/:qrCode', getPublicCenterByQrCode);

// @desc    Create a center
// @route   POST /api/centers
router.post('/', protect, staffOnlyOrSuperAdmin, createCenter);

// @desc    Update a center
// @route   PUT /api/centers/:id
router.put('/:id', protect, staffOnlyOrSuperAdmin, updateCenter);

// @desc    Delete a center
// @route   DELETE /api/centers/:id
router.delete('/:id', protect, staffOnlyOrSuperAdmin, deleteCenter);

module.exports = router;
