const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized - no token');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nse-dev-secret');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      res.status(401);
      throw new Error('User not found');
    }
    next();
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized - invalid token');
  }
});

// Tier-based access control
const requireTier = (...tiers) => asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized');
  }

  const tierHierarchy = { free: 0, pro: 1, founder: 2, enterprise: 3, admin: 4 };
  const userTierLevel = tierHierarchy[req.user.tier] ?? 0;
  const requiredLevel = Math.min(...tiers.map(t => tierHierarchy[t] ?? 999));

  if (userTierLevel < requiredLevel) {
    res.status(403);
    throw new Error(`This feature requires ${tiers[0]} tier or higher. Upgrade at /pricing`);
  }
  next();
});

const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nse-dev-secret');
      req.user = await User.findById(decoded.id).select('-password');
    } catch (_) {}
  }
  next();
});

module.exports = { protect, requireTier, optionalAuth };
