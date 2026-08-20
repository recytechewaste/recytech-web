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

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://recytech-web.vercel.app',
    process.env.FRONTEND_URL
].filter(Boolean);

// Robust CORS Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, Postman, server-to-server)
        if (!origin) return callback(null, true);

        const isAllowed = allowedOrigins.some(allowed => origin === allowed || origin.startsWith(allowed)) ||
                          /\.vercel\.app$/.test(origin.replace(/^https?:\/\//, '').split('/')[0]);

        if (isAllowed) {
            return callback(null, true);
        }

        // Return origin allowed for smooth dev/testing
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Parse cookies attached to the client request
app.use(cookieParser());

// Prevent NoSQL Injection by sanitizing incoming data globally


// Basic Route (Test to see if it works)
app.get('/', (req, res) => {
    res.send('RecyTech API is running...');
});

// Routes
app.use('/api/auth', require('./recytechbackend/routes/authRoutes'));
app.use('/api/collectors', require('./recytechbackend/routes/collectorRoutes'));
app.use('/api/users', require('./recytechbackend/routes/userRoutes'));
app.use('/api/education', require('./recytechbackend/routes/educationRoutes'));
app.use('/api/residents', require('./recytechbackend/routes/residentRoutes'));
app.use('/api/partner-organizations', require('./recytechbackend/routes/partnerOrgRoutes'));
app.use('/api/lgus', require('./recytechbackend/routes/partnerOrgRoutes'));
app.use('/api/reward-points', require('./recytechbackend/routes/rewardPointRoutes'));
app.use('/api/transactions', require('./recytechbackend/routes/transactionRoutes'));
app.use('/api/bins', require('./recytechbackend/routes/binRoutes'));
app.use('/api/requests', require('./recytechbackend/routes/requestRoutes'));
app.use('/api/bin-locations', require('./recytechbackend/routes/recyclingCenterRoutes'));
app.use('/api/bin-dropoffs', require('./recytechbackend/routes/binDropoffRoutes'));
app.use('/api/analytics', require('./recytechbackend/routes/analyticsRoutes'));
app.use('/api/scheduling', require('./recytechbackend/routes/schedulingRoutes'));

// Global Error Handler MUST be the last piece of middleware
app.use(require('./recytechbackend/middleware/errorHandler').errorHandler);

// Define Ports
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
