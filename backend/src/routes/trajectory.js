const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Idea = require('../models/Idea');
const OpportunitySnapshot = require('../models/OpportunitySnapshot');
const { protect, optionalAuth } = require('../middleware/auth');
const { reportOutcome } = require('../services/trajectoryService');

// GET /api/trajectory/rising - momentum leaderboard ("what's heating up")
// A view that ONLY exists because we've been recording history over time.
router.get('/rising', optionalAuth, asyncHandler(async (req, res) => {
  const { limit = 20, industry } = req.query;
  const query = {
    isPublic: true,
    'trajectory.momentum': { $in: ['accelerating', 'rising'] },
  };
  if (industry) query['category.industry'] = industry;

  const ideas = await Idea.find(query)
    .select('title tagline category.industry scoring.opportunityScore trajectory outcome.status')
    .sort('-trajectory.velocity -scoring.opportunityScore')
    .limit(Number(limit))
    .lean();

  res.json({ ideas });
}));

// GET /api/trajectory/:ideaId - full time-series + rollup + outcome ledger
router.get('/:ideaId', optionalAuth, asyncHandler(async (req, res) => {
  const idea = await Idea.findById(req.params.ideaId)
    .select('title trajectory outcome category.industry scoring.opportunityScore')
    .populate('outcome.events.signal', 'title source.url source.name')
    .lean();
  if (!idea) { res.status(404); throw new Error('Idea not found'); }

  // Free tier sees a shorter window; paid tiers get the full history.
  const sinceDays = req.user && req.user.tier !== 'free' ? 365 : 30;
  const snapshots = await OpportunitySnapshot.find({
    idea: idea._id,
    capturedAt: { $gte: new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000) },
  })
    .select('capturedAt metrics delta -_id')
    .sort('capturedAt')
    .lean();

  res.json({
    idea: { _id: idea._id, title: idea.title, industry: idea.category?.industry, score: idea.scoring?.opportunityScore },
    trajectory: idea.trajectory,
    outcome: idea.outcome,
    series: snapshots,
  });
}));

// POST /api/trajectory/:ideaId/outcome - capture human ground-truth (the gold)
// body: { status: 'building'|'launched'|'dead'|..., note?: string }
router.post('/:ideaId/outcome', protect, asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  if (!status) { res.status(400); throw new Error('status is required'); }

  const outcome = await reportOutcome({
    ideaId: req.params.ideaId,
    userId: req.user._id,
    status,
    note,
  });
  res.status(201).json({ message: 'Outcome recorded', ...outcome });
}));

module.exports = router;
