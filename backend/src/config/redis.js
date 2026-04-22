const logger = require('../utils/logger');

let client = null;
let isConnected = false;

// Mock Redis for development without Redis installed
class MockRedis {
  constructor() { this._store = new Map(); this._ttls = new Map(); }
  async get(key) {
    const ttl = this._ttls.get(key);
    if (ttl && Date.now() > ttl) { this._store.delete(key); return null; }
    return this._store.get(key) ?? null;
  }
  async set(key, val, opts = {}) {
    this._store.set(key, val);
    if (opts.EX) this._ttls.set(key, Date.now() + opts.EX * 1000);
    return 'OK';
  }
  async del(key) { this._store.delete(key); return 1; }
  async exists(key) { return this._store.has(key) ? 1 : 0; }
  async expire(key, seconds) { this._ttls.set(key, Date.now() + seconds * 1000); return 1; }
  async incr(key) {
    const val = parseInt(this._store.get(key) || '0') + 1;
    this._store.set(key, String(val));
    return val;
  }
  quit() {}
}

async function connectRedis() {
  if (process.env.REDIS_URL) {
    try {
      const { createClient } = require('redis');
      client = createClient({ url: process.env.REDIS_URL });
      client.on('error', (err) => logger.error('Redis error:', err));
      await client.connect();
      isConnected = true;
      logger.info('✅ Redis connected');
    } catch (err) {
      logger.warn('Redis connection failed, using in-memory mock:', err.message);
      client = new MockRedis();
    }
  } else {
    logger.warn('⚠️  REDIS_URL not set - using in-memory mock cache');
    client = new MockRedis();
  }
}

function getRedis() {
  if (!client) client = new MockRedis();
  return client;
}

async function cache(key, ttlSeconds, fetchFn) {
  const redis = getRedis();
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  const data = await fetchFn();
  await redis.set(key, JSON.stringify(data), { EX: ttlSeconds });
  return data;
}

module.exports = { connectRedis, getRedis, cache };
