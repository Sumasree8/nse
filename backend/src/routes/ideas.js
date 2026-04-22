const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Idea = require('../models/Idea');
const { protect, requireTier, optionalAuth } = require('../middleware/auth');
const { generateStartupIdea } = require('../services/aiService');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');

// GET /api/ideas - List ideas with filters
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 20, industry, trendPhase, minScore,
    sort = '-scoring.opportunityScore', search, featured
  } = req.query;

  const query = { isPublic: true };
  if (industry) query['category.industry'] = industry;
  if (trendPhase) query['scoring.trendPhase'] = trendPhase;
  if (minScore) query['scoring.opportunityScore'] = { $gte: Number(minScore) };
  if (featured === 'true') query.isFeatured = true;
  if (search) query.$text = { $search: search };

  // Free users get limited fields
  const projection = req.user?.tier === 'free'
    ? '-evidence.redditQuotes -execution.mvpPlan -risks.premortem -embedding'
    : '-embedding';

  const [ideas, total] = await Promise.all([
    Idea.find(query)
      .select(projection)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('signals', 'title source.type scoring.compositeScore')
      .lean(),
    Idea.countDocuments(query),
  ]);

  res.json({
    ideas,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
  });
}));

// GET /api/ideas/:id - Single idea with full details
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const cacheKey = `idea:${req.params.id}:${req.user?.tier || 'free'}`;

  const idea = await cache(cacheKey, 300, async () => {
    const projection = req.user && req.user.tier !== 'free' ? '-embedding' : '-embedding -execution.mvpPlan -risks.premortem';
    return Idea.findById(req.params.id)
      .select(projection)
      .populate('signals', 'title source content.summary analysis.frictionPoints scoring')
      .lean();
  });

  if (!idea) { res.status(404); throw new Error('Idea not found'); }

  // Increment view count (async, non-blocking)
  Idea.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).exec();

  res.json({ idea });
}));

// POST /api/ideas/generate - AI idea generation
router.post('/generate', protect, asyncHandler(async (req, res) => {
  const { signals, industry, customPrompt, fundingModel = 'bootstrapped' } = req.body;

  if (!req.user.canPerformAction('ideas')) {
    res.status(429);
    throw new Error(`Monthly idea generation limit reached. Upgrade your plan for more ideas.`);
  }

  logger.info(`Generating idea for user ${req.user._id} | industry: ${industry}`);

  const idea = await generateStartupIdea({ signals, industry, customPrompt, fundingModel, userId: req.user._id });

  // Update usage
  await req.user.updateOne({ $inc: { 'usage.ideasGenerated': 1 } });

  res.status(201).json({ idea, message: 'Idea generated successfully' });
}));

// POST /api/ideas/:id/save
router.post('/:id/save', protect, asyncHandler(async (req, res) => {
  const idea = await Idea.findByIdAndUpdate(req.params.id, { $inc: { saves: 1 } }, { new: true });
  if (!idea) { res.status(404); throw new Error('Idea not found'); }
  res.json({ message: 'Saved', saves: idea.saves });
}));

// GET /api/ideas/:id/similar - Semantic search for similar ideas
router.get('/:id/similar', optionalAuth, requireTier('pro'), asyncHandler(async (req, res) => {
  const idea = await Idea.findById(req.params.id).select('embedding category.industry');
  if (!idea) { res.status(404); throw new Error('Idea not found'); }

  // Simple similarity by industry + tags (full vector search would use Pinecone/Weaviate)
  const similar = await Idea.find({
    _id: { $ne: idea._id },
    'category.industry': idea.category.industry,
    isPublic: true,
  })
    .select('-embedding')
    .sort('-scoring.opportunityScore')
    .limit(6)
    .lean();

  res.json({ similar });
}));

module.exports = router;
