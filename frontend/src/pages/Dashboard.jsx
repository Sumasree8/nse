import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  TrendingUp, Radio, Lightbulb, Sparkles, ArrowUpRight,
  Network, ShieldCheck, Layers
} from 'lucide-react';
import { ideasAPI, signalsAPI, analyticsAPI } from '../utils/api';
import ScoreRing from '../components/common/ScoreRing';

const PHASE_CLASS = { Emerging: 'emerging', Growing: 'growing', Peak: 'peak', Declining: 'declining' };

const ACCENTS = {
  brand:  { c: '#6E86B8', bg: 'rgba(110,134,184,0.12)' },
  cyan:   { c: '#7C93A8', bg: 'rgba(124,147,168,0.12)' },
  violet: { c: '#8F86A8', bg: 'rgba(143,134,168,0.12)' },
  gold:   { c: '#BFA059', bg: 'rgba(191,160,89,0.12)' },
  success:{ c: '#6FA08A', bg: 'rgba(111,160,138,0.12)' },
};

function StatCard({ label, value, sub, icon: Icon, accent = 'cyan', delay = 0 }) {
  const a = ACCENTS[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="card card-hover p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ background: a.bg }}>
          <Icon size={16} style={{ color: a.c }} />
        </div>
        <ArrowUpRight size={13} className="text-muted" />
      </div>
      <div className="font-display font-bold text-2xl text-primary tabular-nums">{value}</div>
      <div className="text-xs text-secondary font-medium mt-1">{label}</div>
      {sub && <div className="text-[11px] font-mono mt-0.5" style={{ color: a.c }}>{sub}</div>}
    </motion.div>
  );
}

// Animated node-and-network "Intelligence Map" — everything is a connected node
function IntelligenceMap({ signals, onOpen }) {
  const positions = [
    [18, 22], [44, 12], [70, 24], [86, 46],
    [26, 58], [54, 48], [76, 70], [34, 82], [62, 84], [12, 78],
  ];
  const nodes = signals.slice(0, positions.length).map((s, i) => {
    const score = s.scoring?.compositeScore ?? 0.5;
    const color = score > 0.82 ? '#BFA059' : score > 0.66 ? '#6FA08A' : score > 0.5 ? '#7C93A8' : '#8F86A8';
    const [x, y] = positions[i];
    return { id: s._id || i, x, y, r: 7 + score * 9, color, score, label: (s.categorization?.industry || 'Signal').split(' ')[0] };
  });
  // connect nearby nodes to suggest "everything is connected"
  const links = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
      if (d < 30) links.push([nodes[i], nodes[j], d]);
    }
  }
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={{ height: 240 }}>
      {links.map(([a, b, d], i) => (
        <line key={`l-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
          stroke="url(#linkgrad)" strokeWidth="0.25" opacity={Math.max(0.08, 0.4 - d / 100)} />
      ))}
      <defs>
        <linearGradient id="linkgrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6E86B8" /><stop offset="100%" stopColor="#8F86A8" />
        </linearGradient>
      </defs>
      {nodes.map((n, i) => (
        <motion.g key={n.id} style={{ cursor: 'pointer' }} onClick={onOpen}
          initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.06, type: 'spring', stiffness: 180 }}>
          <circle cx={n.x} cy={n.y} r={n.r / 3.4} fill={n.color} opacity="0.12">
            <animate attributeName="r" values={`${n.r / 3.4};${n.r / 2.6};${n.r / 3.4}`} dur="5s" repeatCount="indefinite" />
          </circle>
          <circle cx={n.x} cy={n.y} r={n.r / 5.5} fill={n.color} />
        </motion.g>
      ))}
    </svg>
  );
}

function OpportunityCard({ idea, index }) {
  const navigate = useNavigate();
  const score = idea.scoring?.opportunityScore || 0;
  const phase = idea.scoring?.trendPhase || 'Emerging';
  const sources = idea.evidence?.sources?.length || idea.evidence?.newsCitations?.length || 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      onClick={() => navigate(`/app/ideas/${idea._id}`)}
      className="card card-hover p-4 cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <ScoreRing score={score} size={56} strokeWidth={4} showGrade />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`phase-badge ${PHASE_CLASS[phase]}`}>{phase}</span>
            <span className="text-[10px] font-mono text-muted">{idea.category?.industry}</span>
          </div>
          <h3 className="text-sm font-semibold text-primary leading-snug line-clamp-1 font-display">{idea.title}</h3>
          <p className="text-xs text-secondary mt-0.5 line-clamp-1">{idea.tagline}</p>
          <div className="flex items-center gap-2 mt-2">
            {sources > 0 && <span className="chip chip-verified"><ShieldCheck size={10} /> {sources} sources</span>}
            {idea.evidence?.marketData?.tam && <span className="chip chip-live">TAM {idea.evidence.marketData.tam}</span>}
          </div>
        </div>
        <ArrowUpRight size={15} className="text-muted flex-shrink-0 mt-1" />
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: analyticsData } = useQuery({ queryKey: ['analytics'], queryFn: () => analyticsAPI.overview().then(r => r.data) });
  const { data: ideasData }     = useQuery({ queryKey: ['ideas', 'featured'], queryFn: () => ideasAPI.list({ limit: 6, sort: '-scoring.opportunityScore', featured: 'true' }).then(r => r.data) });
  const { data: signalsData }   = useQuery({ queryKey: ['signals', 'heatmap'], queryFn: () => signalsAPI.heatmap().then(r => r.data) });
  const { data: trendingData }  = useQuery({ queryKey: ['signals', 'trending'], queryFn: () => signalsAPI.trending().then(r => r.data) });

  const ideas = ideasData?.ideas || [];
  const trending = trendingData?.trending || [];
  const heatmap = signalsData?.heatmap || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="node node-pulse w-2 h-2" />
          <span className="text-[11px] font-mono text-cyan tracking-[0.2em] uppercase">Intelligence Feed Active</span>
        </div>
        <h1 className="font-display font-bold text-3xl tracking-tight">
          <span className="gradient-text">Global Innovation Pulse</span>
        </h1>
        <p className="text-sm text-secondary mt-1.5">
          The world is changing in real time across{' '}
          <span className="text-primary font-semibold tabular-nums">{analyticsData?.totalSignals?.toLocaleString() || '—'}</span>{' '}
          verified signals. Here's where tomorrow's companies are forming.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Signals Ingested" value={analyticsData?.totalSignals?.toLocaleString() || '—'} sub="↑ live ingestion" icon={Radio} accent="cyan" delay={0} />
        <StatCard label="Active Opportunities" value={analyticsData?.totalIdeas?.toLocaleString() || '—'} sub="evidence-backed" icon={Lightbulb} accent="violet" delay={0.05} />
        <StatCard label="Problem Clusters" value={heatmap.length || '—'} sub="emerging now" icon={Layers} accent="brand" delay={0.1} />
        <StatCard label="Top Sector" value={analyticsData?.topIndustries?.[0]?._id || 'FinTech'} sub="highest velocity" icon={TrendingUp} accent="gold" delay={0.15} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Intelligence Map */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="lg:col-span-1 card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-primary flex items-center gap-2 font-display">
              <Network size={15} className="text-cyan" /> Intelligence Map
            </h2>
            <span className="chip chip-live">LIVE</span>
          </div>
          <p className="text-[11px] text-muted mb-2">Every signal is a node. Everything is connected.</p>
          {trending.length === 0
            ? <div className="h-[240px] flex items-center justify-center text-xs text-muted">Mapping signals…</div>
            : <IntelligenceMap signals={trending} onOpen={() => navigate('/app/signals')} />}
          <div className="flex items-center gap-4 mt-2 pt-3 divider-glow" />
          <div className="flex items-center gap-4 mt-3">
            {[['#BFA059', 'Rare'], ['#6FA08A', 'Verified'], ['#7C93A8', 'Live'], ['#8F86A8', 'AI']].map(([c, l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: c }} />
                <span className="text-[10px] text-secondary font-medium">{l}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Opportunities */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-primary flex items-center gap-2 font-display">
              <Sparkles size={15} className="text-violet" /> Top Opportunities
            </h2>
            <button onClick={() => navigate('/app/ideas')} className="text-xs text-cyan hover:underline flex items-center gap-1">
              View all <ArrowUpRight size={11} />
            </button>
          </div>
          {ideas.length === 0
            ? <div className="card p-8 text-center text-muted text-sm">Surfacing opportunities…</div>
            : ideas.slice(0, 4).map((idea, i) => <OpportunityCard key={idea._id} idea={idea} index={i} />)}
        </div>
      </div>

      {/* High-friction signals — evidence ticker */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-primary flex items-center gap-2 font-display">
            <Radio size={15} className="text-cyan" /> High-Friction Signals
          </h2>
          <button onClick={() => navigate('/app/signals')} className="text-xs text-cyan hover:underline flex items-center gap-1">
            View all <ArrowUpRight size={11} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {trending.slice(0, 4).map((signal, i) => (
            <motion.div
              key={signal._id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => navigate('/app/signals')}
              className="card card-hover p-4 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="chip chip-live">{signal.source?.type || 'news'}</span>
                <span className="text-[11px] font-mono text-success">{Math.round((signal.scoring?.compositeScore || 0.5) * 100)}</span>
              </div>
              <p className="text-xs font-medium text-secondary leading-snug line-clamp-2">{signal.title}</p>
              <div className="mt-2 text-[10px] font-mono text-muted">{signal.categorization?.industry}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Sector velocity */}
      {analyticsData?.topIndustries?.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2 font-display">
            <TrendingUp size={15} className="text-brand" /> Sector Velocity
          </h2>
          <div className="card p-5">
            <div className="space-y-3.5">
              {analyticsData.topIndustries.slice(0, 6).map((ind, i) => {
                const max = analyticsData.topIndustries[0]?.count || 1;
                const pct = Math.round((ind.count / max) * 100);
                return (
                  <div key={ind._id} className="flex items-center gap-3">
                    <div className="w-28 text-xs text-secondary truncate font-mono">{ind._id || 'General'}</div>
                    <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ delay: i * 0.05 + 0.3, duration: 0.7 }}
                        className="h-full rounded-full"
                        style={{ background: 'var(--gradient-brand)' }}
                      />
                    </div>
                    <div className="w-8 text-right text-[10px] font-mono text-muted">{ind.count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
