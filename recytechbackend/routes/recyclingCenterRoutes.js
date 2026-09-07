const express = require('express');
const router = express.Router();
const { protect, staffOrAdmin } = require('../middleware/authMiddleware');
const { 
    getCenters,
    getCenterByQrCode,
    getPublicCenterByQrCode,
    createCenter,
    updateCenter,
    deleteCenter 
} = require('../controllers/recyclingCenterController');

// @desc    Get all centers (Public map view)
// @route   GET /api/bin-locations/public
router.get('/public', getCenters);

// @desc    Get a center by QR code for public resident mobile flow
// @route   GET /api/bin-locations/public/qr/:qrCode
router.get('/public/qr/:qrCode', getPublicCenterByQrCode);

// @desc    Get all centers (Authenticated)
// @route   GET /api/bin-locations
router.get('/', protect, getCenters);

// @desc    Get a center by QR code
// @route   GET /api/bin-locations/qr/:qrCode
router.get('/qr/:qrCode', protect, getCenterByQrCode);

// @desc    Create a center
// @route   POST /api/bin-locations
router.post('/', protect, staffOrAdmin, createCenter);

// @desc    Update a center
// @route   PUT /api/bin-locations/:id
router.put('/:id', protect, staffOrAdmin, updateCenter);

// @desc    Delete a center
// @route   DELETE /api/bin-locations/:id
router.delete('/:id', protect, staffOrAdmin, deleteCenter);

module.exports = router;

