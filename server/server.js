require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
require('./config/redis'); // Initialize optional Redis connection / fallback cache

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const examRoutes = require('./routes/examRoutes');
const questionRoutes = require('./routes/questionRoutes');
const attemptRoutes = require('./routes/attemptRoutes');
const resultRoutes = require('./routes/resultRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');
const graphqlRouter = require('./graphql');

const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.IO Server
const io = initSocket(httpServer);

// Connect to MongoDB
connectDB();

// Security Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  })
);

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general API rate limiting
app.use('/api', apiLimiter);

// Serve static uploads if needed
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount REST API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// Mount Selective GraphQL Endpoint
app.use('/graphql', graphqlRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'HEALTHY',
    service: 'ExamSphere Backend API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    features: {
      redisAvailable: require('./config/redis').isRedisConnected(),
      proctoringEngine: 'ACTIVE',
      graphqlEndpoint: '/graphql',
    },
  });
});

// Centralized Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Handle port conflict and server errors gracefully
httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[ExamSphere Server] ⚠️ Port ${PORT} is currently in use by another process.`);
    console.error(`[ExamSphere Server] Run the following command in PowerShell to free port ${PORT}:`);
    console.error(`   Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force\n`);
  } else {
    console.error('[ExamSphere Server] Server error:', err.message);
  }
  process.exit(1);
});

if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`[ExamSphere Server] Running in ${process.env.NODE_ENV || 'development'} on port ${PORT}`);
    console.log(`[ExamSphere GraphQL] Endpoint available at http://localhost:${PORT}/graphql`);
  });
}

module.exports = { app, httpServer };