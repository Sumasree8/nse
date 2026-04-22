const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Signal = require('../models/Signal');
const Idea = require('../models/Idea');
const { cache } = require('../config/redis');

// GET /api/analytics/overview
router.get('/overview', asyncHandler(async (req, res) => {
  const data = await cache('analytics:overview', 300, async () => {
    const [totalSignals, totalIdeas, topIndustries, recentActivity] = await Promise.all([
      Signal.countDocuments(),
      Idea.countDocuments({ isPublic: true }),
      Idea.aggregate([
        { $group: { _id: '$category.industry', count: { $sum: 1 }, avgScore: { $avg: '$scoring.opportunityScore' } } },
        { $sort: { count: -1 } }, { $limit: 8 },
      ]),
      Signal.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);
    return { totalSignals, totalIdeas, topIndustries, recentActivity };
  });
  res.json(data);
}));

module.exports = router;
