const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Signal = require('../models/Signal');
const { optionalAuth } = require('../middleware/auth');
const { cache } = require('../config/redis');

// GET /api/signals - List signals
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { page = 1, limit = 30, industry, sourceType, minScore = 0, startDate, endDate } = req.query;

  const query = {};
  if (industry) query['categorization.industry'] = industry;
  if (sourceType) query['source.type'] = sourceType;
  if (minScore) query['scoring.compositeScore'] = { $gte: Number(minScore) };
  if (startDate || endDate) {
    query['metadata.publishedAt'] = {};
    if (startDate) query['metadata.publishedAt'].$gte = new Date(startDate);
    if (endDate) query['metadata.publishedAt'].$lte = new Date(endDate);
  }

  const [signals, total] = await Promise.all([
    Signal.find(query)
      .select('-embedding -content')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean(),
    Signal.countDocuments(query),
  ]);

  res.json({
    signals,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
  });
}));

// GET /api/signals/heatmap - Dashboard heatmap data
router.get('/heatmap', asyncHandler(async (req, res) => {
  const data = await cache('signals:heatmap', 600, async () => {
    return Signal.aggregate([
      { $match: { 'scoring.compositeScore': { $gte: 0.4 } } },
      {
        $group: {
          _id: '$categorization.industry',
          count: { $sum: 1 },
          avgScore: { $avg: '$scoring.compositeScore' },
          avgPainIntensity: { $avg: '$analysis.painIntensity' },
          topics: { $push: '$analysis.topics' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);
  });

  res.json({ heatmap: data });
}));

// GET /api/signals/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const signal = await Signal.findById(req.params.id).select('-embedding').lean();
  if (!signal) { res.status(404); throw new Error('Signal not found'); }
  res.json({ signal });
}));

// GET /api/signals/trending - Top trending signals
router.get('/meta/trending', asyncHandler(async (req, res) => {
  const trending = await cache('signals:trending', 300, async () => {
    return Signal.find({ processed: true })
      .select('-embedding -content')
      .sort('-scoring.compositeScore -createdAt')
      .limit(10)
      .lean();
  });
  res.json({ trending });
}));

module.exports = router;
