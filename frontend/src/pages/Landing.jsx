import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, Shield, ArrowRight, CheckCircle, Radio, Lightbulb, Hammer } from 'lucide-react';
import { analyticsAPI } from '../utils/api';

const FEATURES = [
  { icon: Radio, label: 'Live Signal Feed', desc: 'Ingests real news (RSS + GDELT + Reddit) around the clock — no API key required.' },
  { icon: TrendingUp, label: 'Delta Detection', desc: 'Spots emerging trends before they peak using frequency growth + sentiment shifts.' },
  { icon: Shield, label: 'Validated Opportunities', desc: '5-factor scoring: Trend, Pain, Market, Competition, Complexity — all weighted.' },
  { icon: Lightbulb, label: 'Evidence Trail', desc: 'Every opportunity backed by real news citations and verified sources. Trust, not hype.' },
  { icon: Hammer, label: '72-Hour MVP Plan', desc: 'Step-by-step build guide with tools, tech stack, smoke test copy, and personas.' },
  { icon: Zap, label: 'Why-Now Engine', desc: 'Temporal intelligence that shows exactly why the timing is right — and for how long.' },
];

const PRICING = [
  { tier: 'Free', price: '₹0', period: 'forever', features: ['5 ideas/month', '20 signal views', 'Basic scoring', 'Community access'], cta: 'Start Free', highlight: false },
  { tier: 'Pro', price: '₹2,499', period: '/month', features: ['100 ideas/month', '500 signal views', 'Full evidence trail', '72hr MVP plans', 'Watchlist alerts', 'API access (500 calls)'], cta: 'Start Pro', highlight: true },
  { tier: 'Founder', price: '₹7,999', period: '/month', features: ['Unlimited everything', 'Priority AI generation', 'VC intelligence reports', 'White-label export', 'Dedicated support', 'Custom API limits'], cta: 'Go Founder', highlight: false },
];

// Real, live platform metrics (fetched from the public analytics endpoint).
// No fabricated vanity numbers — these reflect what's actually in the database.
function useLiveStats() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    let active = true;
    analyticsAPI.overview()
      .then(r => {
        if (!active) return;
        const d = r.data || {};
        const inds = d.topIndustries || [];
        const avg = inds.length ? Math.round(inds.reduce((a, x) => a + (x.avgScore || 0), 0) / inds.length) : null;
        setStats([
          { label: 'Live Signals Tracked', value: (d.totalSignals ?? 0).toLocaleString('en-IN') },
          { label: 'Opportunities Surfaced', value: (d.totalIdeas ?? 0).toLocaleString('en-IN') },
          { label: 'Sectors Monitored', value: String(inds.length || 0) },
          { label: 'Avg Opportunity Score', value: avg != null ? `${avg}/100` : '—' },
        ]);
      })
      .catch(() => { if (active) setStats(null); });
    return () => { active = false; };
  }, []);
  return stats;
}

export default function Landing() {
  const navigate = useNavigate();
  const stats = useLiveStats();

  return (
    <div className="min-h-screen bg-page text-secondary overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 glass border-b border-default">
        <div className="flex items-center gap-2.5">
          <span className="node node-pulse w-3 h-3" />
          <span className="font-display font-bold gradient-text text-lg">NSE</span>
          <span className="text-[10px] font-mono text-muted ml-1 hidden sm:inline">The Intelligence Layer for Founders</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pricing')} className="text-xs text-secondary hover:text-primary transition-colors">Pricing</button>
          <button onClick={() => navigate('/auth/login')} className="btn-ghost text-xs py-2 px-4">Login</button>
          <button onClick={() => navigate('/auth/register')} className="btn-primary text-xs py-2 px-4">Start Free</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 text-center overflow-hidden">
        {/* Background — a single, faint cool wash. No animated aurora. */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[720px] h-[320px] rounded-full opacity-[0.10]"
          style={{ background: 'radial-gradient(ellipse at 50% 40%, var(--brand) 0%, transparent 65%)', filter: 'blur(80px)' }} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand border border-brand text-brand text-xs font-mono mb-6">
            <span className="node node-pulse w-1.5 h-1.5" />
            The world's innovation pulse · live, verified, evidence-first
          </div>

          <h1 className="font-display font-bold text-4xl md:text-6xl text-primary leading-tight max-w-4xl mx-auto">
            Where Real-World Problems
            <br />
            <span className="gradient-text">Become Startups</span>
          </h1>

          <p className="text-lg text-secondary mt-6 max-w-2xl mx-auto leading-relaxed">
            NSE is the intelligence layer for founders — a live view of what is changing in the world,
            why it's changing, and which problems will exist next. Real verified signals in, evidence-backed,
            execution-ready opportunities out.
          </p>

          <div className="flex items-center justify-center gap-4 mt-10">
            <button onClick={() => navigate('/auth/register')} className="btn-primary px-8 py-3 text-sm">
              Start for Free <ArrowRight size={14} />
            </button>
            <button onClick={() => navigate('/auth/login')} className="btn-ghost px-8 py-3 text-sm">
              See Live Demo
            </button>
          </div>

          <p className="text-xs text-muted mt-4">No credit card required · 5 ideas free every month</p>
        </motion.div>

        {/* Product preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mt-16 max-w-4xl mx-auto rounded-xl overflow-hidden card"
        >
          <div className="bg-panel px-4 py-2 border-b border-default flex items-center gap-2">
            {['#e0675f', '#d8a64a', '#5f9e6a'].map(c => <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />)}
            <span className="text-[10px] font-mono text-muted ml-2">NSE — Global Innovation Pulse</span>
            <span className="ml-auto text-[10px] font-mono text-cyan inline-flex items-center gap-1"><span className="node w-1.5 h-1.5" /> LIVE</span>
          </div>
          <div className="bg-panel p-6 grid grid-cols-4 gap-3">
            {['INGESTED', 'ACTIVE', 'COVERED', 'AVG SCORE'].map((label, i) => (
              <div key={label} className="bg-subtle rounded-lg p-3 border border-default">
                <div className="text-[9px] font-mono text-muted mb-1">{label}</div>
                <div className="text-sm font-bold text-brand font-mono tabular-nums">{stats ? stats[i].value : '—'}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Stats — real, live counts from the database */}
      {stats && (
        <section className="py-16 px-6 border-y border-default bg-panel/40">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: i * 0.08 }}>
                <div className="text-2xl font-bold font-display gradient-text tabular-nums">{s.value}</div>
                <div className="text-xs text-muted mt-1">{s.label}</div>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-[10px] text-muted font-mono mt-6">Live figures · updated continuously from real news ingestion</p>
        </section>
      )}

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display font-bold text-3xl text-primary text-center mb-4">Intelligence at Every Layer</h2>
          <p className="text-muted text-center text-sm mb-12">From raw signal ingestion to execution-ready blueprints</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="card card-hover p-5"
                >
                  <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center mb-3">
                    <Icon size={15} className="text-brand" />
                  </div>
                  <h3 className="text-sm font-semibold text-primary mb-1">{f.label}</h3>
                  <p className="text-xs text-muted leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 bg-panel/40 border-y border-default">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-bold text-3xl text-primary text-center mb-4">Simple, Transparent Pricing</h2>
          <p className="text-muted text-center text-sm mb-12">Start free. Upgrade when you're ready to go deep.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map((plan, i) => (
              <motion.div
                key={plan.tier}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`card p-6 ${plan.highlight ? 'border-2 border-brand' : ''}`}
              >
                {plan.highlight && (
                  <div className="chip chip-live mb-3">MOST POPULAR</div>
                )}
                <div className="text-sm font-semibold text-secondary mb-1">{plan.tier}</div>
                <div className="flex items-end gap-1 mb-5">
                  <span className="font-display font-bold text-3xl text-primary">{plan.price}</span>
                  <span className="text-xs text-muted mb-1">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-secondary">
                      <CheckCircle size={11} className="text-success flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/auth/register')}
                  className={plan.highlight ? 'btn-primary w-full justify-center' : 'btn-ghost w-full justify-center'}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-xs text-muted mt-6">Enterprise API licensing from ₹8,00,000/year · <a href="mailto:enterprise@nse.ai" className="text-brand hover:underline">Contact us</a></p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display font-bold text-3xl text-primary mb-4">Ready to find your next startup?</h2>
          <p className="text-muted text-sm mb-8">Spot opportunities before your competitors — sourced straight from today's news.</p>
          <button onClick={() => navigate('/auth/register')} className="btn-primary px-10 py-3 text-sm">
            Start for Free <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-default py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="node w-2.5 h-2.5" />
          <span className="font-display font-bold gradient-text text-sm">NSE</span>
        </div>
        <p className="text-[10px] text-muted font-mono">The Intelligence Layer for Founders · Mission Control for Innovation · © 2026</p>
      </footer>
    </div>
  );
}
