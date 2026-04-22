const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'nse-dev-secret', { expiresIn: '30d' });

// POST /api/auth/register
router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    res.status(400); throw new Error('All fields required');
  }
  if (password.length < 8) {
    res.status(400); throw new Error('Password must be at least 8 characters');
  }

  let user;
  try {
    const exists = await User.findOne({ email });
    if (exists) { res.status(409); throw new Error('Email already registered'); }
    user = await User.create({ email, password, name });
  } catch (err) {
    if (err.code === 11000) { res.status(409); throw new Error('Email already registered'); }
    throw err;
  }

  logger.info(`New user registered: ${user.email} (${user._id})`);

  res.status(201).json({
    token: generateToken(user._id),
    user: user.toPublicJSON(),
    message: 'Account created successfully',
  });
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400); throw new Error('Email and password required'); }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    res.status(401); throw new Error('Invalid credentials');
  }

  user.lastLogin = new Date();
  await user.save();

  res.json({
    token: generateToken(user._id),
    user: user.toPublicJSON(),
  });
}));

// GET /api/auth/me
router.get('/me', protect, asyncHandler(async (req, res) => {
  res.json({ user: req.user.toPublicJSON() });
}));

// POST /api/auth/refresh
router.post('/refresh', protect, asyncHandler(async (req, res) => {
  res.json({ token: generateToken(req.user._id) });
}));

// POST /api/auth/generate-api-key
router.post('/generate-api-key', protect, asyncHandler(async (req, res) => {
  if (!['founder', 'enterprise', 'admin'].includes(req.user.tier)) {
    res.status(403); throw new Error('API key generation requires Founder tier or higher');
  }
  req.user.apiKey = `nse_${uuidv4().replace(/-/g, '')}`;
  await req.user.save();
  res.json({ apiKey: req.user.apiKey });
}));

module.exports = router;
