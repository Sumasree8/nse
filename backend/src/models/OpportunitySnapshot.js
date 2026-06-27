const mongoose = require('mongoose');

/**
 * OpportunitySnapshot — the proprietary, compounding data layer.
 *
 * One row per opportunity per recording cycle. Free public feeds (RSS/GDELT/
 * Reddit) are clonable in a weekend; a *longitudinal record of how each
 * opportunity's real-world signal base evolves over time* is not — it can only
 * be accumulated by running the pipeline day after day. This time-series is the
 * moat: momentum, half-life, and (eventually) signal-pattern → realized-outcome
 * calibration all derive from it.
 */
const snapshotSchema = new mongoose.Schema({
  idea: { type: mongoose.Schema.Types.ObjectId, ref: 'Idea', required: true, index: true },
  capturedAt: { type: Date, default: Date.now, index: true },

  metrics: {
    opportunityScore: Number,      // 0-100
    demandIndex: Number,           // 0-100 (from marketSignals)
    signalCount: Number,           // total real signals linked to the idea
    newSignals7d: Number,          // signals attached in the trailing week (inflow)
    sourceBreadth: Number,         // distinct domains corroborating
    verifiedShare: Number,         // 0-1 fraction verified/corroborated
    competitorCount: Number,
    avgPain: Number,               // 0-1
    trendPhase: String,
  },

  // change vs the previous snapshot for the same idea (so trends are first-class,
  // not recomputed on every read)
  delta: {
    opportunityScore: { type: Number, default: 0 },
    demandIndex: { type: Number, default: 0 },
    signalCount: { type: Number, default: 0 },
  },
}, { timestamps: true });

// One idea's history, newest first — the core read pattern.
snapshotSchema.index({ idea: 1, capturedAt: -1 });

module.exports = mongoose.model('OpportunitySnapshot', snapshotSchema);
