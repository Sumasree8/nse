const mongoose = require('mongoose');
const logger = require('../utils/logger');

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nse';

  try {
    await mongoose.connect(uri, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    logger.info(`✅ MongoDB connected: ${mongoose.connection.host}`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
      isConnected = false;
    });

  } catch (err) {
    logger.error('MongoDB connection failed:', err.message);
    // In development, continue without DB for demo purposes
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('⚠️  Running without MongoDB - using in-memory mock data');
    } else {
      throw err;
    }
  }
}

async function disconnectDB() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
}

module.exports = { connectDB, disconnectDB };
