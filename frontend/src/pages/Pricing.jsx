import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowLeft, Zap } from 'lucide-react';

const PLANS = [
  {
    tier: 'Free', price: '$0', period: 'forever', color: '#8b9ab0',
    features: ['5 AI idea generations/month', '20 signals per day', 'Basic opportunity scoring', 'Community discussion', 'Public idea library access'],
    limitations: ['No evidence trail', 'No MVP plans', 'No pre-mortem analysis'],
    cta: 'Get Started',
  },
  {
    tier: 'Pro', price: '$29', period: '/month', color: '#00d4ff', highlight: true,
    features: ['100 AI idea generations/month', '500 signals per day', 'Full evidence trail (Reddit + News)', '72-hour MVP build plans', 'Competitor gap maps', 'Pre-mortem failure analysis', 'Watchlist + alerts', '500 API calls/month', 'Smoke test copy generator'],
    cta: 'Start Pro — $29/mo',
  },
  {
    tier: 'Founder', price: '$99', period: '/month', color: '#00ff88',
    features: ['Unlimited AI generations', 'Unlimited signals', 'Everything in Pro', 'VC intelligence reports (PDF)', 'API key + 5,000 calls/month', 'White-label export', 'Priority support', 'Early access to new features'],
    cta: 'Go Founder — $99/mo',
  },
  {
    tier: 'Enterprise', price: 'Custom', period: '', color: '#bf00ff',
    features: ['Everything in Founder', 'Dedicated API with SLA', 'Custom data ingestion sources', 'White-label dashboard', 'On-prem deployment option', 'Quarterly trend reports', 'Dedicated success manager', 'Custom contract & invoicing'],
    cta: 'Contact Sales',
  },
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-0 bg-grid px-6 py-16">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 mb-10 transition-colors">
        <ArrowLeft size={13} /> Back
      </button>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-neon-green flex items-center justify-center">
              <Zap size={12} fill="#080b12" stroke="none" />
            </div>
            <span className="font-display font-bold text-white">NSE Pricing</span>
          </div>
          <h1 className="font-display font-bold text-3xl text-white mb-3">Choose Your Intelligence Level</h1>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            From solo founders to VC-backed teams — NSE scales with your ambition.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.tier}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`card p-6 flex flex-col ${plan.highlight ? 'border-2' : ''}`}
              style={plan.highlight ? { borderColor: plan.color + '60', boxShadow: `0 0 40px ${plan.color}10` } : {}}
            >
              {plan.highlight && (
                <div className="text-[9px] font-mono mb-3 px-2 py-0.5 rounded-full inline-block border"
                  style={{ color: plan.color, borderColor: plan.color + '40', background: plan.color + '10' }}>
                  MOST POPULAR
                </div>
              )}

              <div className="text-sm font-semibold mb-1" style={{ color: plan.color }}>{plan.tier}</div>
              <div className="flex items-end gap-1 mb-5">
                <span className="font-display font-bold text-2xl text-white">{plan.price}</span>
                <span className="text-xs text-gray-500 mb-0.5">{plan.period}</span>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-[11px] text-gray-400">
                    <CheckCircle size={10} className="flex-shrink-0 mt-0.5" style={{ color: plan.color }} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => plan.tier === 'Enterprise' ? window.open('mailto:enterprise@nse.ai') : navigate('/auth/register')}
                className={plan.highlight ? 'btn-primary w-full justify-center text-xs py-2.5' : 'btn-ghost w-full justify-center text-xs py-2.5'}
                style={plan.highlight ? { background: plan.color } : {}}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 card p-6 text-center">
          <h3 className="text-sm font-semibold text-gray-200 mb-2">Enterprise API Licensing</h3>
          <p className="text-xs text-gray-500 max-w-lg mx-auto mb-4">
            Build NSE intelligence into your own products. White-label dashboard, custom data ingestion,
            dedicated infrastructure, SLA guarantees. Starting at $10,000/year.
          </p>
          <a href="mailto:enterprise@nse.ai" className="btn-primary text-xs inline-flex">
            <Zap size={12} /> Contact Enterprise Sales
          </a>
        </div>
      </div>
    </div>
  );
}
