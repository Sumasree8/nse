const mongoose = require('mongoose');

const clusterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  centroidEmbedding: { type: [Number], select: false },
  theme: String,
  industry: { type: String, index: true },
  tags: [String],
  signalCount: { type: Number, default: 0 },
  ideaCount: { type: Number, default: 0 },
  momentum: { type: Number, min: 0, max: 1, default: 0 },
  trendPhase: { type: String, enum: ['Emerging', 'Growing', 'Peak', 'Declining'] },
  topSignals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Signal' }],
  topIdeas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Idea' }],
  velocityHistory: [{
    date: Date,
    signalCount: Number,
    momentum: Number,
  }],
}, { timestamps: true });

module.exports = mongoose.model('Cluster', clusterSchema);
