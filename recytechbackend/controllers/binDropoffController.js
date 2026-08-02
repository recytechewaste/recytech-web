const BinDropoff = require('../models/BinDropoff');
const RecyclingCenter = require('../models/RecyclingCenter');
const { asyncHandler } = require('../utils/asyncHandler');
const { calculatePointsAwarded } = require('../utils/calculatePoints');

const resolveBinFromInput = async (binId, qrCode) => {
    if (binId) {
        return { resolvedBinId: binId, matchedBin: null };
    }

    if (!qrCode) {
        return { resolvedBinId: null, matchedBin: null };
    }

    const normalizedQrCode = qrCode.trim();
    const matchedBin = await RecyclingCenter.findOne({ qrCode: normalizedQrCode });

    if (!matchedBin) {
        return { resolvedBinId: null, matchedBin: null };
    }

    return { resolvedBinId: matchedBin._id, matchedBin };
};

const createDropoff = asyncHandler(async (req, res) => {
    const { binId, qrCode, participantEmail, participantName, wasteType, kilograms, notes } = req.body;

    if (!wasteType || kilograms === undefined) {
        res.status(400);
        throw new Error('wasteType and kilograms are required');
    }

    const { resolvedBinId, matchedBin } = await resolveBinFromInput(binId, qrCode);

    if (!resolvedBinId) {
        res.status(400);
        throw new Error('binId or qrCode is required');
    }

    if (!matchedBin && qrCode) {
        res.status(404);
        throw new Error('Bin QR code not found');
    }

    const incentiveResult = await calculatePointsAwarded(wasteType, Number(kilograms));

    const dropoff = await BinDropoff.create({
        binId: resolvedBinId,
        participantEmail: participantEmail || '',
        participantName: participantName || '',
        wasteType,
        kilograms: Number(kilograms),
        pointsAwarded: incentiveResult.success ? incentiveResult.points : 0,
        notes: notes || ''
    });

    res.status(201).json(dropoff);
});

const createPublicDropoff = asyncHandler(async (req, res) => {
    const { qrCode, participantEmail, participantName, wasteType, kilograms, notes } = req.body;

    if (!wasteType || kilograms === undefined) {
        res.status(400);
        throw new Error('wasteType and kilograms are required');
    }

    const { resolvedBinId, matchedBin } = await resolveBinFromInput(null, qrCode);

    if (!resolvedBinId) {
        res.status(400);
        throw new Error('A valid bin QR code is required');
    }

    if (!matchedBin) {
        res.status(404);
        throw new Error('Bin QR code not found');
    }

    const incentiveResult = await calculatePointsAwarded(wasteType, Number(kilograms));

    const dropoff = await BinDropoff.create({
        binId: resolvedBinId,
        participantEmail: participantEmail || '',
        participantName: participantName || '',
        wasteType,
        kilograms: Number(kilograms),
        pointsAwarded: incentiveResult.success ? incentiveResult.points : 0,
        notes: notes || ''
    });

    res.status(201).json({
        success: true,
        message: 'Drop-off recorded successfully',
        dropoff,
        bin: {
            id: matchedBin._id,
            name: matchedBin.name,
            address: matchedBin.address,
            status: matchedBin.status
        }
    });
});

const getDropoffs = asyncHandler(async (req, res) => {
    const dropoffs = await BinDropoff.find().sort({ createdAt: -1 }).populate('binId', 'name address status');
    res.json(dropoffs);
});

module.exports = {
    createDropoff,
    createPublicDropoff,
    getDropoffs
};
