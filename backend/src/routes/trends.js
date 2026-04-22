// trends.js
const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Signal = require('../models/Signal');
const Idea = require('../models/Idea');
const { cache } = require('../config/redis');

router.get('/', asyncHandler(async (req, res) => {
  const trends = await cache('trends:global', 600, async () => {
    const [byIndustry, byPhase, velocity] = await Promise.all([
      Idea.aggregate([
        { $group: { _id: '$category.industry', count: { $sum: 1 }, avgScore: { $avg: '$scoring.opportunityScore' } } },
        { $sort: { avgScore: -1 } }, { $limit: 15 },
      ]),
      Idea.aggregate([
        { $group: { _id: '$scoring.trendPhase', count: { $sum: 1 } } },
      ]),
      Signal.aggregate([
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }, { $limit: 30 },
      ]),
    ]);
    return { byIndustry, byPhase, velocity };
  });
  res.json({ trends });
}));

module.exports = router;
