const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./recytechbackend/config/db');
// Load config
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Change to your frontend dev URL
    credentials: true // Required for HTTP-only cookies to be sent
})); 
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Parse cookies attached to the client request
app.use(cookieParser());

// Prevent NoSQL Injection by sanitizing incoming data globally


// Basic Route (Test to see if it works)
app.get('/', (req, res) => {
    res.send('RecyTech API is running...');
});

// Routes
app.use('/api/auth', require('./recytechbackend/routes/authRoutes'));
app.use('/api/requests', require('./recytechbackend/routes/requestRoutes'));
app.use('/api/collectors', require('./recytechbackend/routes/collectorRoutes'));
app.use('/api/users', require('./recytechbackend/routes/userRoutes'));
app.use('/api/education', require('./recytechbackend/routes/educationRoutes'));
app.use('/api/residents', require('./recytechbackend/routes/residentRoutes'));
app.use('/api/exchange-rates', require('./recytechbackend/routes/exchangeRateRoutes'));
app.use('/api/transactions', require('./recytechbackend/routes/transactionRoutes'));
//app.use('/api/recycling-centers', require('./recytechbackend/routes/recyclingCenterRoutes'));
app.use('/api/analytics', require('./recytechbackend/routes/analyticsRoutes'));
app.use('/api/scheduling', require('./recytechbackend/routes/schedulingRoutes'));

// Global Error Handler MUST be the last piece of middleware
app.use(require('./recytechbackend/middleware/errorHandler').errorHandler);

// Define Ports
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
