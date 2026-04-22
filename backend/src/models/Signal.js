const mongoose = require('mongoose');

const signalSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  content: { type: String, required: true },
  summary: String,
  source: {
    type: { type: String, enum: ['news', 'reddit', 'rss', 'regulatory', 'review', 'trends', 'twitter'], required: true },
    name: String,
    url: String,
    domain: String,
    credibilityScore: { type: Number, min: 0, max: 1, default: 0.7 },
  },
  metadata: {
    publishedAt: Date,
    author: String,
    language: { type: String, default: 'en' },
    region: String,
    upvotes: Number,
    comments: Number,
    shares: Number,
    engagement: Number,
  },
  analysis: {
    sentiment: { score: Number, label: String },
    topics: [String],
    entities: [{ text: String, type: String, relevance: Number }],
    keywords: [{ word: String, frequency: Number, tfidf: Number }],
    frictionPoints: [{ description: String, intensity: Number, category: String }],
    painIntensity: { type: Number, min: 0, max: 1, default: 0 },
  },
  categorization: {
    industry: { type: String, index: true },
    subIndustry: String,
    problemCategory: String,
    tags: [String],
  },
  scoring: {
    relevanceScore: { type: Number, min: 0, max: 1, default: 0 },
    urgencyScore: { type: Number, min: 0, max: 1, default: 0 },
    noveltyScore: { type: Number, min: 0, max: 1, default: 0 },
    compositeScore: { type: Number, min: 0, max: 1, default: 0 },
  },
  embedding: { type: [Number], select: false },
  clusterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cluster' },
  processed: { type: Boolean, default: false, index: true },
  hash: { type: String, unique: true, index: true },
  deduplicatedFrom: [mongoose.Schema.Types.ObjectId],

}, { timestamps: true });

signalSchema.index({ createdAt: -1 });
signalSchema.index({ 'categorization.industry': 1, 'scoring.compositeScore': -1 });
signalSchema.index({ 'source.type': 1, 'metadata.publishedAt': -1 });

module.exports = mongoose.model('Signal', signalSchema);
