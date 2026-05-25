const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial
} = require('../controllers/educationController');

// @desc    Get all materials
// @route   GET /api/education
router.get('/', protect, getMaterials);

// @desc    Create new material
// @route   POST /api/education
router.post('/', protect, createMaterial);

// @desc    Update material
// @route   PUT /api/education/:id
router.put('/:id', protect, updateMaterial);

// @desc    Delete material
// @route   DELETE /api/education/:id
router.delete('/:id', protect, deleteMaterial);

module.exports = router;