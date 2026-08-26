const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./recytechbackend/config/db');
// Load config
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// 1. Security HTTP Headers (Resolves CSP, Clickjacking, HSTS, MIME sniffing alerts)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "http://localhost:5173", "http://localhost:3000", "https://recytech-web.vercel.app", "*.vercel.app"]
        }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    frameguard: {
        action: 'deny'
    }
}));

// 2. Prevent Sensitive API Data Caching (Resolves Cache-control alerts)
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://recytech-web.vercel.app',
    process.env.FRONTEND_URL
].filter(Boolean);

// 3. Robust & Secure CORS Middleware (Resolves Cross-Domain Misconfiguration)
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, Postman, server-to-server)
        if (!origin) return callback(null, true);

        const isAllowed = allowedOrigins.some(allowed => origin === allowed || origin.startsWith(allowed)) ||
                          /\.vercel\.app$/.test(origin.replace(/^https?:\/\//, '').split('/')[0]);

        if (isAllowed) {
            return callback(null, true);
        }

        // Strictly reject unauthorized cross-origin requests
        return callback(new Error('Not allowed by CORS policy'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Parse cookies attached to the client request
app.use(cookieParser());

// Prevent NoSQL Injection by sanitizing incoming request payloads (Express 5 compatible)
app.use((req, res, next) => {
    const cleanNoSQL = (target) => {
        if (target && typeof target === 'object') {
            for (const key in target) {
                if (key.startsWith('$') || key.includes('.')) {
                    delete target[key];
                } else if (typeof target[key] === 'object') {
                    cleanNoSQL(target[key]);
                }
            }
        }
    };
    if (req.body) cleanNoSQL(req.body);
    if (req.params) cleanNoSQL(req.params);
    next();
});


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
