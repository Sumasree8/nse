const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  description: String,
  ideas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Idea' }],
  clusters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cluster' }],
  keywords: [String],
  industries: [String],
  alerts: {
    enabled: { type: Boolean, default: true },
    frequency: { type: String, enum: ['realtime', 'daily', 'weekly'], default: 'daily' },
    email: { type: Boolean, default: true },
  },
  lastAlertAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('Watchlist', watchlistSchema);
