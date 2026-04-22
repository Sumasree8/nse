import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, Shield, ArrowRight, CheckCircle, Radio, Lightbulb, Hammer } from 'lucide-react';

const FEATURES = [
  { icon: Radio, label: 'Live Signal Feed', desc: 'Ingests 500+ sources: news, Reddit, regulatory, reviews — 24/7.' },
  { icon: TrendingUp, label: 'Delta Detection', desc: 'AI spots emerging trends before they peak using frequency growth + sentiment shifts.' },
  { icon: Shield, label: 'Validated Opportunities', desc: '5-factor scoring: Trend, Pain, Market, Competition, Complexity — all weighted.' },
  { icon: Lightbulb, label: 'Evidence Trail', desc: 'Every idea backed by Reddit quotes, news citations, regulatory refs. Trust, not hype.' },
  { icon: Hammer, label: '72-Hour MVP Plan', desc: 'Step-by-step build guide with tools, tech stack, smoke test copy, and personas.' },
  { icon: Zap, label: 'Why-Now Engine', desc: 'Temporal intelligence that shows exactly why the timing is right — and for how long.' },
];

const PRICING = [
  { tier: 'Free', price: '$0', period: 'forever', features: ['5 ideas/month', '20 signal views', 'Basic scoring', 'Community access'], cta: 'Start Free', highlight: false },
  { tier: 'Pro', price: '$29', period: '/month', features: ['100 ideas/month', '500 signal views', 'Full evidence trail', '72hr MVP plans', 'Watchlist alerts', 'API access (500 calls)'], cta: 'Start Pro', highlight: true },
  { tier: 'Founder', price: '$99', period: '/month', features: ['Unlimited everything', 'Priority AI generation', 'VC intelligence reports', 'White-label export', 'Dedicated support', 'Custom API limits'], cta: 'Go Founder', highlight: false },
];

const STATS = [
  { label: 'Signals Processed', value: '2.4M+' },
  { label: 'Opportunities Generated', value: '18,000+' },
  { label: 'Countries Covered', value: '47' },
  { label: 'Avg Opportunity Score', value: '74/100' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-0 text-gray-200 overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-surface-0/80 backdrop-blur-md border-b border-surface-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-neon-green flex items-center justify-center">
            <Zap size={14} fill="#080b12" stroke="none" />
          </div>
          <span className="font-display font-bold text-white">NSE</span>
          <span className="text-[10px] font-mono text-gray-600 ml-1">News-to-Startup Engine</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pricing')} className="text-xs text-gray-500 hover:text-gray-200 transition-colors">Pricing</button>
          <button onClick={() => navigate('/auth/login')} className="btn-ghost text-xs py-2 px-4">Login</button>
          <button onClick={() => navigate('/auth/register')} className="btn-primary text-xs py-2 px-4">Start Free</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(ellipse, #00ff88 0%, transparent 70%)', filter: 'blur(60px)' }} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-green/10 border border-neon-green/20 text-neon-green text-xs font-mono mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
            Live intelligence feed · 2.4M+ signals processed
          </div>

          <h1 className="font-display font-bold text-4xl md:text-6xl text-white leading-tight max-w-4xl mx-auto">
            Turn Global Problems Into
            <br />
            <span className="gradient-text">Validated Startup Ideas</span>
          </h1>

          <p className="text-lg text-gray-400 mt-6 max-w-2xl mx-auto leading-relaxed">
            NSE is the Bloomberg Terminal for startup intelligence. AI detects emerging real-world problems
            from 500+ sources and converts them into evidence-backed, execution-ready opportunities.
          </p>

          <div className="flex items-center justify-center gap-4 mt-10">
            <button onClick={() => navigate('/auth/register')} className="btn-primary px-8 py-3 text-sm">
              Start for Free <ArrowRight size={14} />
            </button>
            <button onClick={() => navigate('/auth/login')} className="btn-ghost px-8 py-3 text-sm">
              See Live Demo
            </button>
          </div>

          <p className="text-xs text-gray-600 mt-4">No credit card required · 5 ideas free every month</p>
        </motion.div>

        {/* Fake dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mt-16 max-w-4xl mx-auto rounded-xl overflow-hidden border border-surface-3 shadow-2xl"
          style={{ boxShadow: '0 0 80px rgba(0,255,136,0.08)' }}
        >
          <div className="bg-surface-1 px-4 py-2 border-b border-surface-3 flex items-center gap-2">
            {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />)}
            <span className="text-[10px] font-mono text-gray-600 ml-2">NSE Dashboard — Global Signal Feed</span>
            <span className="ml-auto text-[10px] font-mono text-neon-green">● LIVE</span>
          </div>
          <div className="bg-surface-1 p-6 grid grid-cols-4 gap-3">
            {['2.4M Signals', '18K Ideas', '47 Countries', 'Score: 74'].map((s, i) => (
              <div key={i} className="bg-surface-2 rounded-lg p-3 border border-surface-3">
                <div className="text-[9px] font-mono text-gray-600 mb-1">{['INGESTED', 'ACTIVE', 'COVERED', 'AVG SCORE'][i]}</div>
                <div className="text-sm font-bold text-neon-green font-mono">{s.split(' ')[0]}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-surface-3 bg-surface-1/30">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: i * 0.08 }}>
              <div className="text-2xl font-bold font-display gradient-text">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display font-bold text-3xl text-white text-center mb-4">Intelligence at Every Layer</h2>
          <p className="text-gray-500 text-center text-sm mb-12">From raw signal ingestion to execution-ready blueprints</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="card p-5"
                >
                  <div className="w-8 h-8 rounded-lg bg-neon-green/10 flex items-center justify-center mb-3">
                    <Icon size={15} className="text-neon-green" />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{f.label}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 bg-surface-1/30 border-y border-surface-3">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-bold text-3xl text-white text-center mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-500 text-center text-sm mb-12">Start free. Upgrade when you're ready to go deep.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`card p-6 ${plan.highlight ? 'border-neon-green/40 bg-neon-green/5' : ''}`}
                style={plan.highlight ? { boxShadow: '0 0 30px rgba(0,255,136,0.08)' } : {}}
              >
                {plan.highlight && (
                  <div className="text-[10px] font-mono text-neon-green border border-neon-green/30 rounded-full px-2 py-0.5 inline-block mb-3">MOST POPULAR</div>
                )}
                <div className="text-sm font-semibold text-gray-300 mb-1">{plan.tier}</div>
                <div className="flex items-end gap-1 mb-5">
                  <span className="font-display font-bold text-3xl text-white">{plan.price}</span>
                  <span className="text-xs text-gray-500 mb-1">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-gray-400">
                      <CheckCircle size={11} className="text-neon-green flex-shrink-0" />{f}
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
          <p className="text-center text-xs text-gray-600 mt-6">Enterprise API licensing from $10,000/year · <a href="mailto:enterprise@nse.ai" className="text-neon-green hover:underline">Contact us</a></p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display font-bold text-3xl text-white mb-4">Ready to find your next startup?</h2>
          <p className="text-gray-500 text-sm mb-8">Join thousands of founders using NSE to spot opportunities before competitors</p>
          <button onClick={() => navigate('/auth/register')} className="btn-primary px-10 py-3 text-sm">
            Start for Free <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-3 py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-5 h-5 rounded bg-neon-green flex items-center justify-center">
            <Zap size={10} fill="#080b12" stroke="none" />
          </div>
          <span className="font-display font-bold text-white text-sm">NSE</span>
        </div>
        <p className="text-[10px] text-gray-600 font-mono">News-to-Startup Engine · AI-Powered Global Intelligence · © 2025</p>
      </footer>
    </div>
  );
}
