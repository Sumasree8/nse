#!/usr/bin/env node
/**
 * NSE Seed Script
 * Creates a demo user + seeds signals and ideas into MongoDB.
 *
 * Usage:
 *   cd backend
 *   node scripts/seed.js
 *
 * The server also auto-seeds on startup when ENABLE_INGESTION=true,
 * so running this manually is optional.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nse';

async function seed() {
  console.log('🌱 NSE Seed Script starting...');
  console.log(`   Connecting to: ${MONGODB_URI}`);

  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB connected\n');
  } catch (err) {
    console.error('❌ Cannot connect to MongoDB:', err.message);
    console.error('   Make sure MongoDB is running: docker run -d -p 27017:27017 --name mongo mongo:7');
    process.exit(1);
  }

  // Dynamic requires after DB connected
  const User    = require('../src/models/User');
  const { seedMockData } = require('../src/services/aiService');
  const { ingestMockSignalsForSeed } = require('../src/services/ingestionScheduler');

  // ── Demo user ──────────────────────────────────────────────────────────────
  const demoEmail = 'demo@nse.ai';
  let demoUser = await User.findOne({ email: demoEmail });

  if (!demoUser) {
    demoUser = await User.create({
      email: demoEmail,
      password: 'demo1234',
      name: 'Demo Founder',
      tier: 'founder',
      emailVerified: true,
    });
    console.log('✅ Demo user created');
    console.log('   Email   : demo@nse.ai');
    console.log('   Password: demo1234');
    console.log('   Tier    : founder (full access)\n');
  } else {
    console.log('ℹ️  Demo user already exists (demo@nse.ai)\n');
  }

  // ── Signals ────────────────────────────────────────────────────────────────
  try {
    await ingestMockSignalsForSeed();
    console.log('✅ Mock signals seeded\n');
  } catch (e) {
    console.warn('⚠️  Signal seeding skipped:', e.message);
  }

  // ── Ideas ──────────────────────────────────────────────────────────────────
  try {
    await seedMockData();
    console.log('✅ Mock startup ideas seeded\n');
  } catch (e) {
    console.warn('⚠️  Idea seeding skipped:', e.message);
  }

  const Signal = require('../src/models/Signal');
  const Idea   = require('../src/models/Idea');
  const signalCount = await Signal.countDocuments();
  const ideaCount   = await Idea.countDocuments();

  console.log('📊 Database summary:');
  console.log(`   Signals : ${signalCount}`);
  console.log(`   Ideas   : ${ideaCount}`);
  console.log(`   Users   : ${await User.countDocuments()}`);
  console.log('\n🚀 Seed complete! Start the server with: npm run dev');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
