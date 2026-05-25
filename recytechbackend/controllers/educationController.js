const Education = require('../models/Education');
const { asyncHandler } = require('../utils/asyncHandler');

const getMaterials = asyncHandler(async (req, res) => {
    const materials = await Education.find({}).sort({ createdAt: -1 });
    res.json(materials);
});

const createMaterial = asyncHandler(async (req, res) => {
    const material = await Education.create(req.body);
    res.status(201).json(material);
});

const updateMaterial = asyncHandler(async (req, res) => {
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