const Education = require('../models/Education');
const { asyncHandler } = require('../utils/asyncHandler');

const getMaterials = asyncHandler(async (req, res) => {
    const materials = await Education.find({}).sort({ createdAt: -1 });
    res.json(materials);
});

const validateImageUri = (imageStr) => {
    if (!imageStr) return true;
    const isValidUrl = /^https?:\/\//.test(imageStr);
    const isValidBase64Image = /^data:image\/(jpeg|png|jpg|gif|webp);base64,/.test(imageStr);
    return isValidUrl || isValidBase64Image;
};

const createMaterial = asyncHandler(async (req, res) => {
    const { title, category, type, description, contentURL, thumbnail, status } = req.body;
    if (!validateImageUri(thumbnail)) {
        res.status(400);
        throw new Error('Invalid thumbnail format. Must be a valid URL or base64 image data URI.');
    }
    const material = await Education.create({ title, category, type, description, contentURL, thumbnail, status });
    res.status(201).json(material);
});

const updateMaterial = asyncHandler(async (req, res) => {
    if (req.body.thumbnail && !validateImageUri(req.body.thumbnail)) {
        res.status(400);
        throw new Error('Invalid thumbnail format. Must be a valid URL or base64 image data URI.');
    }
    const material = await Education.findById(req.params.id);

    if (material) {
        material.title = req.body.title || material.title;
        material.category = req.body.category || material.category;
        material.type = req.body.type || material.type;
        material.description = req.body.description || material.description;
        material.contentURL = req.body.contentURL || material.contentURL;
        material.thumbnail = req.body.thumbnail || material.thumbnail;
        material.status = req.body.status || material.status;

        const updated = await material.save();
        res.json(updated);
    } else {
        res.status(404);
        throw new Error('Material not found');
    }
});

const deleteMaterial = asyncHandler(async (req, res) => {
    const material = await Education.findById(req.params.id);
    if (material) {
        await material.deleteOne();
        res.json({ message: 'Material removed' });
    } else {
        res.status(404);
        throw new Error('Material not found');
    }
});

module.exports = {
    getMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial
};