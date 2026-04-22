const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Watchlist = require('../models/Watchlist');
const { protect } = require('../middleware/auth');

// GET /api/watchlist
router.get('/', protect, asyncHandler(async (req, res) => {
  const lists = await Watchlist.find({ userId: req.user._id })
    .populate('ideas', 'title scoring.opportunityScore scoring.trendPhase category.industry')
    .lean();
  res.json({ watchlists: lists });
}));

// POST /api/watchlist
router.post('/', protect, asyncHandler(async (req, res) => {
  const { name, description, keywords, industries } = req.body;
  if (!name) { res.status(400); throw new Error('Name is required'); }
  const list = await Watchlist.create({ userId: req.user._id, name, description, keywords, industries });
  res.status(201).json({ watchlist: list });
}));

// POST /api/watchlist/:id/add-idea
router.post('/:id/add-idea', protect, asyncHandler(async (req, res) => {
  const { ideaId } = req.body;
  const list = await Watchlist.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $addToSet: { ideas: ideaId } },
    { new: true }
  );
  if (!list) { res.status(404); throw new Error('Watchlist not found'); }
  res.json({ watchlist: list });
}));

// DELETE /api/watchlist/:id
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  await Watchlist.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  res.json({ message: 'Watchlist deleted' });
}));

module.exports = router;
