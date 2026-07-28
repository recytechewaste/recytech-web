const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        // The DESTROY command
        if (process.argv[2] === '-destroy') {
            console.log('No legacy request data to destroy.');
            process.exit();
        }

        console.log('Legacy request seeding is disabled for the new bin-based workflow.');
        process.exit();
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedData();