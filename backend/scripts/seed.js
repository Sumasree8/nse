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
  const { runIngestion } = require('../src/services/ingestionScheduler');

  // ── Demo user ──────────────────────────────────────────────────────────────
  const demoEmail = 'demo@gmail.com';
  const demoPassword = 'demo@1234';
  let demoUser = await User.findOne({ email: demoEmail });

  if (!demoUser) {
    demoUser = await User.create({
      email: demoEmail,
      password: demoPassword,
      name: 'Demo Founder',
      tier: 'founder',
      emailVerified: true,
    });
    console.log('✅ Demo user created');
    console.log(`   Email   : ${demoEmail}`);
    console.log(`   Password: ${demoPassword}`);
    console.log('   Tier    : founder (full access)\n');
  } else {
    console.log(`ℹ️  Demo user already exists (${demoEmail})\n`);
  }

  // ── Signals (real news ingestion) ────────────────────────────────────────────
  try {
    console.log('📡 Running real news ingestion (RSS + GDELT)…');
    const { runIngestion } = require('../src/services/ingestionScheduler');
    const result = await runIngestion();
    console.log(`✅ Ingestion complete — fetched ${result.fetched || 0}, inserted ${result.inserted || 0}, rejected ${result.rejected || 0}\n`);
  } catch (e) {
    console.warn('⚠️  Signal ingestion skipped:', e.message);
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
