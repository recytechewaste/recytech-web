const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Request = require('./models/Request');
const Resident = require('./models/Resident');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        // Find or create the dummy resident
        let dummyResident = await Resident.findOne({ email: 'seedtest@recytech.local' });
        
        // The DESTROY command
        if (process.argv[2] === '-destroy') {
            if (dummyResident) {
                await Request.deleteMany({ resident: dummyResident._id });
                await Resident.deleteOne({ _id: dummyResident._id });
                console.log('All historical test data destroyed successfully!');
            } else {
                console.log('No test data found to destroy.');
            }
            process.exit();
        }

        // The SEED command
        if (!dummyResident) {
            dummyResident = await Resident.create({
                firstName: 'Historical',
                lastName: 'Test',
                email: 'seedtest@recytech.local',
                phone: '09123456789',
                status: 'Active',
                isTemporary: true
            });
        }

        const testRequests = [];
        const currentDate = new Date();

        // Generate 24 months of perfectly crafted math data
        for (let i = 0; i < 24; i++) {
            const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 15);
            
            // 1. Create a naturally INCREASING trend over 2 years
            let requestCount = 5 + (23 - i); 

            // 2. Trigger SEASONAL PATTERN (Massive spike every December)
            if (targetDate.getMonth() === 11) {
                requestCount += 40;
            }

            // 3. Trigger OUTLIER MONTH (Massive anomaly 4 months ago)
            if (i === 4) {
                requestCount += 80;
            }

            for (let j = 0; j < requestCount; j++) {
                const specificDate = new Date(targetDate);
                specificDate.setDate(Math.floor(Math.random() * 28) + 1); // Randomize the day

                testRequests.push({
                    resident: dummyResident._id,
                    residentName: 'Historical Test',
                    wasteType: 'Smartphone',
                    quantity: Math.floor(Math.random() * 3) + 1,
                    status: 'Completed',
                    location: { address: 'Sampaloc, Manila City' },
                    createdAt: specificDate,
                    updatedAt: specificDate
                });
            }
        }

        await Request.insertMany(testRequests);
        console.log(`Successfully seeded ${testRequests.length} historical requests!`);
        process.exit();
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedData();