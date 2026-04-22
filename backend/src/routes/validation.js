const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Idea = require('../models/Idea');
const { protect } = require('../middleware/auth');
const { runValidationEngine } = require('../services/validationService');

// GET /api/validation/:id - Full validation report for an idea
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const idea = await Idea.findById(req.params.id).lean();
  if (!idea) { res.status(404); throw new Error('Idea not found'); }

  const validation = await runValidationEngine(idea);
  res.json({ validation });
}));

// POST /api/validation/custom - Validate a custom idea description
router.post('/custom', protect, asyncHandler(async (req, res) => {
  const { title, description, industry } = req.body;
  if (!title || !description) { res.status(400); throw new Error('Title and description required'); }

  const fakeIdea = { title, description, category: { industry } };
  const validation = await runValidationEngine(fakeIdea);
  res.json({ validation });
}));

module.exports = router;
