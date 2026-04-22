const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Cluster = require('../models/Cluster');
const { cache } = require('../config/redis');

router.get('/', asyncHandler(async (req, res) => {
  const clusters = await cache('clusters:all', 300, async () => {
    return Cluster.find()
      .select('-centroidEmbedding')
      .sort('-momentum')
      .limit(50)
      .populate('topIdeas', 'title scoring.opportunityScore category.industry')
      .lean();
  });
  res.json({ clusters });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const cluster = await Cluster.findById(req.params.id)
    .select('-centroidEmbedding')
    .populate('topIdeas topSignals')
    .lean();
  if (!cluster) { res.status(404); throw new Error('Cluster not found'); }
  res.json({ cluster });
}));

module.exports = router;
