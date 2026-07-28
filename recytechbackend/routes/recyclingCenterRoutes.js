const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { 
    getCenters,
    getCenterByQrCode,
    getPublicCenterByQrCode,
    createCenter,
    updateCenter,
    deleteCenter 
} = require('../controllers/recyclingCenterController');

// @desc    Get all centers
// @route   GET /api/centers
router.get('/', protect, admin, getCenters);

// @desc    Get a center by QR code
// @route   GET /api/centers/qr/:qrCode
router.get('/qr/:qrCode', protect, admin, getCenterByQrCode);

// @desc    Get a center by QR code for the resident mobile flow
// @route   GET /api/bin-locations/public/qr/:qrCode
router.get('/public/qr/:qrCode', getPublicCenterByQrCode);

// @desc    Create a center
// @route   POST /api/centers
router.post('/', protect, admin, createCenter);

// @desc    Update a center
// @route   PUT /api/centers/:id
router.put('/:id', protect, admin, updateCenter);

// @desc    Delete a center
// @route   DELETE /api/centers/:id
router.delete('/:id', protect, admin, deleteCenter);

module.exports = router;
