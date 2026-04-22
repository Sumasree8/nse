require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const signalRoutes = require('./routes/signals');
const ideaRoutes = require('./routes/ideas');
const clusterRoutes = require('./routes/clusters');
const trendRoutes = require('./routes/trends');
const watchlistRoutes = require('./routes/watchlist');
const validationRoutes = require('./routes/validation');
const userRoutes = require('./routes/users');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// ── Security & Middleware ─────────────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(morgan('combined', { stream: { write: msg => logger.http(msg.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Global Rate Limiting ──────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: { error: 'AI generation rate limit exceeded. Upgrade to Pro for higher limits.' },
});

app.use('/api/', globalLimiter);
app.use('/api/ideas/generate', aiLimiter);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      redis: 'connected',
      ai: 'operational',
    },
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/signals', signalRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/clusters', clusterRoutes);
app.use('/api/trends', trendRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/validation', validationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Server Bootstrap ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

async function bootstrap() {
  try {
    await connectDB();
    await connectRedis();

    app.listen(PORT, () => {
      logger.info(`🚀 NSE Backend running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Start background ingestion scheduler
    if (process.env.ENABLE_INGESTION !== 'false') {
      const { startIngestionScheduler } = require('./services/ingestionScheduler');
      startIngestionScheduler();
      logger.info('📡 Ingestion scheduler started');
    }
  } catch (err) {
    logger.error('Failed to bootstrap server:', err);
    process.exit(1);
  }
}

bootstrap();

module.exports = app;
