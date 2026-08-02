const mongoose = require('mongoose');
const Request = require('../models/Request');
const BinDropoff = require('../models/BinDropoff');
const Resident = require('../models/Resident');
const Transaction = require('../models/Transaction');
const { calculatePointsAwarded } = require('../utils/calculatePoints');

/**
 * Completes a collection request and distributes reward points to residents.
 * This entire process is transactional.
 * @param {string} requestId - The ID of the request to complete.
 * @param {Array} collectedWaste - The data on collected waste.
 * @returns {object} The updated request.
 */
async function completeCollectionAndDistributePoints(requestId, collectedWaste) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Find and update the request
        const request = await Request.findById(requestId).session(session);
        if (!request) {
            throw new Error('Request not found');
        }
        if (request.status === 'Completed') {
            throw new Error('This collection has already been completed.');
        }

        request.status = 'Completed';
        request.completionDate = new Date();
        request.collectedWaste = collectedWaste;
        const updatedRequest = await request.save();

        console.log(`Starting point distribution for request: ${request._id}`);

        // 2. Find all unprocessed dropoffs for the bin
        const dropoffs = await BinDropoff.find({ bin: request.bin, processed: false }).session(session);

        if (!dropoffs || dropoffs.length === 0) {
            console.log(`No unprocessed dropoffs found for bin ${request.bin}. No points to distribute.`);
            await session.commitTransaction();
            session.endSession();
            return updatedRequest;
        }

        // 3. Calculate total points
        let totalPoints = 0;
        for (const item of collectedWaste) {
            const result = await calculatePointsAwarded(item.category, item.quantity);
            if (result.success) {
                totalPoints += result.points;
            } else {
                console.warn(`Could not calculate points for category ${item.category}: ${result.message}`);
            }
        }

        if (totalPoints > 0) {
            // 4. Distribute points
            const residentIds = [...new Set(dropoffs.map(d => d.resident.toString()))];
            const pointsPerResident = Math.floor(totalPoints / residentIds.length);

            console.log(`Total points: ${totalPoints}. Residents: ${residentIds.length}. Points/resident: ${pointsPerResident}`);

            if (pointsPerResident > 0) {
                // 5. Update resident balances and create transactions
                for (const residentId of residentIds) {
                    await Resident.findByIdAndUpdate(residentId, 
                        { $inc: { pointsBalance: pointsPerResident, totalPoints: pointsPerResident } },
                        { session }
                    );

                    await Transaction.create([{
                        resident: residentId,
                        type: 'Payment',
                        points: pointsPerResident,
                        requestId: request._id,
                        description: `Reward for contribution to bin collection.`
                    }], { session });
                }
            }
        }

        // 6. Mark dropoffs as processed
        await BinDropoff.updateMany(
            { _id: { $in: dropoffs.map(d => d._id) } },
            { $set: { processed: true } }
        ).session(session);

        console.log('Point distribution completed successfully.');
        await session.commitTransaction();
        return updatedRequest;

    } catch (error) {
        console.error('Error during collection completion. Rolling back transaction.', error);
        await session.abortTransaction();
        throw error; // Rethrow to be caught by the controller
    } finally {
        session.endSession();
    }
}

module.exports = {
    completeCollectionAndDistributePoints,
};
