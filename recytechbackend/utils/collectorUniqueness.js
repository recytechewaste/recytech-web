const Collector = require('../models/Collector');

// Placeholder values that are allowed to repeat across collectors
const PLACEHOLDERS = new Set(['', 'NOT ASSIGNED', 'NOT PROVIDED', 'N/A', 'NA', 'NONE']);

/**
 * Normalize a vehicle plate for comparison: uppercase, no spaces or dashes.
 * "abc-1234", "ABC 1234" and "ABC1234" are all treated as the same plate.
 */
const normalizePlate = (plate) => String(plate || '').toUpperCase().replace(/[\s-]/g, '');

/**
 * Normalize a phone number for comparison: digits only, PH local format.
 * "+63 917 123 4567", "09171234567" and "917-123-4567" are treated as the same number.
 */
const normalizePhone = (phone) => {
    let digits = String(phone || '').replace(/\D/g, '');
    if (digits.startsWith('63')) digits = digits.slice(2);
    if (digits.startsWith('0')) digits = digits.slice(1);
    return digits;
};

const isPlaceholder = (value) => PLACEHOLDERS.has(String(value || '').trim().toUpperCase());

/**
 * Clean a plate for storage (trimmed, uppercase, single spaces). Placeholders become 'Not Assigned'.
 */
const formatPlateForStorage = (plate) => {
    if (isPlaceholder(plate)) return 'Not Assigned';
    return String(plate).trim().toUpperCase().replace(/\s+/g, ' ');
};

/**
 * Throws a 400 error if another collector already uses the given phone number or vehicle plate.
 * Comparison is normalized, so formatting differences cannot be used to bypass the check.
 *
 * @param {Object} params
 * @param {string} [params.phone]        - Phone number to check
 * @param {string} [params.vehiclePlate] - Vehicle plate to check
 * @param {string} [params.excludeId]    - Collector _id to ignore (the one being edited)
 * @param {Object} [res]                 - Express response, used to set the 400 status
 */
const assertUniqueCollectorFields = async ({ phone, vehiclePlate, excludeId } = {}, res) => {
    const checkPhone = phone !== undefined && !isPlaceholder(phone);
    const checkPlate = vehiclePlate !== undefined && !isPlaceholder(vehiclePlate);
    if (!checkPhone && !checkPlate) return;

    const query = excludeId ? { _id: { $ne: excludeId } } : {};
    const others = await Collector.find(query).select('firstName lastName phone vehiclePlate').lean();

    const targetPhone = normalizePhone(phone);
    const targetPlate = normalizePlate(vehiclePlate);

    for (const other of others) {
        const owner = `${other.firstName || ''} ${other.lastName || ''}`.trim() || 'another collector';

        if (checkPhone && targetPhone && !isPlaceholder(other.phone) && normalizePhone(other.phone) === targetPhone) {
            if (res) res.status(400);
            throw new Error(`Phone number is already registered to ${owner}.`);
        }

        if (checkPlate && targetPlate && !isPlaceholder(other.vehiclePlate) && normalizePlate(other.vehiclePlate) === targetPlate) {
            if (res) res.status(400);
            throw new Error(`Vehicle plate ${formatPlateForStorage(vehiclePlate)} is already assigned to ${owner}.`);
        }
    }
};

module.exports = {
    assertUniqueCollectorFields,
    formatPlateForStorage,
    normalizePlate,
    normalizePhone
};
