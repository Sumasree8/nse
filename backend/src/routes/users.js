const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/users/profile
router.get('/profile', protect, asyncHandler(async (req, res) => {
  res.json({ user: req.user.toPublicJSON() });
}));

// PUT /api/users/profile
router.put('/profile', protect, asyncHandler(async (req, res) => {
  const allowed = ['name', 'preferences', 'avatar'];
  const updates = {};
  allowed.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
  res.json({ user: user.toPublicJSON() });
}));

// GET /api/users/usage
router.get('/usage', protect, asyncHandler(async (req, res) => {
  res.json({
    usage:  req.user.usage,
    limits: req.user.getTierLimits(),
    tier:   req.user.tier,
  });
}));

// POST /api/users/upgrade (mock - integrate Stripe in production)
router.post('/upgrade', protect, asyncHandler(async (req, res) => {
  const { tier } = req.body;
  const validTiers = ['pro', 'founder', 'enterprise'];
  if (!validTiers.includes(tier)) { res.status(400); throw new Error('Invalid tier'); }
  await User.findByIdAndUpdate(req.user._id, { tier });
  res.json({ message: `Upgraded to ${tier}`, tier });
}));

module.exports = router;
