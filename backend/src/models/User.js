const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Tier limits kept outside schema — plain config, not stored in DB
const TIER_LIMITS = {
  free:       { ideas: 5,       signals: 20,  reports: 0  },
  pro:        { ideas: 100,     signals: 500, reports: 10 },
  founder:    { ideas: -1,      signals: -1,  reports: -1 },
  enterprise: { ideas: -1,      signals: -1,  reports: -1 },
  admin:      { ideas: -1,      signals: -1,  reports: -1 },
};

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  password: { type: String, required: true, minlength: 8, select: false },
  name:     { type: String, required: true, trim: true },
  avatar:   { type: String, default: null },

  tier: {
    type: String,
    enum: ['free', 'pro', 'founder', 'enterprise', 'admin'],
    default: 'free',
    index: true,
  },

  usage: {
    ideasGenerated:    { type: Number, default: 0 },
    signalsViewed:     { type: Number, default: 0 },
    reportsDownloaded: { type: Number, default: 0 },
    apiCalls:          { type: Number, default: 0 },
    lastReset:         { type: Date,   default: Date.now },
  },

  subscription: {
    stripeCustomerId: { type: String, default: null },
    stripePriceId:    { type: String, default: null },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'past_due', 'trialing'],
      default: 'active',
    },
    currentPeriodEnd: { type: Date, default: null },
  },

  preferences: {
    industries:   { type: [String], default: [] },
    regions:      { type: [String], default: [] },
    riskTolerance: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    fundingModel: {
      type: String,
      enum: ['bootstrapped', 'venture'],
      default: 'bootstrapped',
    },
    notifications: {
      email:           { type: Boolean, default: true },
      watchlistAlerts: { type: Boolean, default: true },
      weeklyDigest:    { type: Boolean, default: true },
    },
  },

  apiKey:                 { type: String, unique: true, sparse: true },
  lastLogin:              { type: Date,    default: null },
  isActive:               { type: Boolean, default: true },
  emailVerified:          { type: Boolean, default: false },
  emailVerificationToken: { type: String,  default: null },
  passwordResetToken:     { type: String,  default: null },
  passwordResetExpires:   { type: Date,    default: null },

}, { timestamps: true });

// ── Hooks ─────────────────────────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Instance methods ──────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getTierLimits = function () {
  return TIER_LIMITS[this.tier] || TIER_LIMITS.free;
};

userSchema.methods.canPerformAction = function (action) {
  const limits = this.getTierLimits();
  const limit  = limits[action];
  if (limit === -1) return true; // unlimited
  const used = this.usage[`${action}Generated`] || 0;
  return used < limit;
};

userSchema.methods.toPublicJSON = function () {
  return {
    id:          this._id,
    email:       this.email,
    name:        this.name,
    avatar:      this.avatar,
    tier:        this.tier,
    usage:       this.usage,
    limits:      this.getTierLimits(),
    preferences: this.preferences,
    createdAt:   this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
