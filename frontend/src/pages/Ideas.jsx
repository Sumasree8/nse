import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ArrowUpRight, Bookmark, TrendingUp, Clock, Zap } from 'lucide-react';
import { ideasAPI, formatMarketSize } from '../utils/api';
import ScoreRing from '../components/common/ScoreRing';
import clsx from 'clsx';

const INDUSTRIES = ['All', 'FinTech', 'HealthTech', 'Supply Chain', 'HR Tech', 'Legal Tech', 'E-Commerce', 'Climate Tech', 'Restaurant Tech', 'Construction', 'AI / ML'];
const PHASES = ['All', 'Emerging', 'Growing', 'Peak', 'Declining'];
const SORTS = [
  { value: '-scoring.opportunityScore', label: 'Highest Score' },
  { value: '-createdAt', label: 'Newest' },
  { value: '-views', label: 'Most Viewed' },
  { value: '-saves', label: 'Most Saved' },
];

const PHASE_MAP = { Emerging: 'emerging', Growing: 'growing', Peak: 'peak', Declining: 'declining' };

function IdeaCard({ idea }) {
  const navigate = useNavigate();
  const score = idea.scoring?.opportunityScore || 0;
  const phase = idea.scoring?.trendPhase;
  const delta = idea.scoring?.deltaScore;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -2 }}
      onClick={() => navigate(`/app/ideas/${idea._id}`)}
      className="card p-5 cursor-pointer border border-default hover:border-strong transition-all duration-200"
    >
      {/* Top row */}
      <div className="flex items-start gap-4">
        <ScoreRing score={score} size={56} strokeWidth={3} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {phase && <span className={`phase-badge ${PHASE_MAP[phase]}`}>{phase}</span>}
            <span className="text-[10px] font-mono text-muted bg-subtle px-2 py-0.5 rounded-full">
              {idea.category?.industry}
            </span>
            {idea.isFeatured && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-yellow-500/10 text-warning border border-yellow-500/20">
                ★ Featured
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-white leading-snug">{idea.title}</h3>
          <p className="text-xs text-secondary mt-1 line-clamp-2">{idea.tagline}</p>
        </div>
      </div>

      {/* Score components bar */}
      {idea.scoring?.components && (
        <div className="mt-4 space-y-1.5">
          {[
            { label: 'Trend', value: idea.scoring.components.trendStrength?.score, color: 'var(--success)' },
            { label: 'Pain', value: idea.scoring.components.painIntensity?.score, color: 'var(--info)' },
            { label: 'Market', value: idea.scoring.components.marketSize?.score, color: '#8b5cf6' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted w-10">{label}</span>
              <div className="flex-1 h-1 bg-subtle rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${value || 0}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: color }}
                />
              </div>
              <span className="text-[10px] font-mono w-6 text-right" style={{ color }}>{value || 0}</span>
            </div>
          ))}
        </div>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-default">
        <div className="flex items-center gap-4">
          {idea.evidence?.marketData?.tam && (
            <div>
              <div className="text-[9px] text-muted font-mono uppercase">TAM</div>
              <div className="text-xs font-mono text-brand">{idea.evidence.marketData.tam}</div>
            </div>
          )}
          {delta !== undefined && (
            <div>
              <div className="text-[9px] text-muted font-mono uppercase">Delta</div>
              <div className="text-xs font-mono text-info">{Math.round(delta * 100)}%</div>
            </div>
          )}
          <div>
            <div className="text-[9px] text-muted font-mono uppercase">Risk</div>
            <div className={clsx('text-xs font-mono', {
              'text-brand': idea.risks?.overallRisk === 'low',
              'text-warning': idea.risks?.overallRisk === 'medium',
              'text-danger': idea.risks?.overallRisk === 'high' || idea.risks?.overallRisk === 'critical',
            })}>
              {idea.risks?.overallRisk || '—'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted font-mono">
          <span>{idea.views || 0} views</span>
          <ArrowUpRight size={12} className="text-muted" />
        </div>
      </div>
    </motion.div>
  );
}

export default function Ideas() {
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('All');
  const [phase, setPhase] = useState('All');
  const [sort, setSort] = useState('-scoring.opportunityScore');

  const params = {
    limit: 24,
    sort,
    ...(industry !== 'All' && { industry }),
    ...(phase !== 'All' && { trendPhase: phase }),
    ...(search && { search }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['ideas', params],
    queryFn: () => ideasAPI.list(params).then(r => r.data),
    keepPreviousData: true,
  });

  const ideas = data?.ideas || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-white">Startup Opportunities</h1>
        <p className="text-sm text-secondary mt-1">
          {data?.pagination?.total || '—'} validated opportunities ranked by Opportunity Score
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search opportunities..."
            className="input-field pl-9"
          />
        </div>

        {/* Industry pills */}
        <div className="flex gap-2 flex-wrap">
          {INDUSTRIES.map(ind => (
            <button
              key={ind}
              onClick={() => setIndustry(ind)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150',
                industry === ind
                  ? 'bg-brand border-brand/40 text-brand'
                  : 'bg-card border-default text-secondary hover:text-primary hover:border-gray-500'
              )}
            >
              {ind}
            </button>
          ))}
        </div>

        {/* Phase + Sort */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-muted">
            <Filter size={12} />
            <span>Phase:</span>
          </div>
          {PHASES.map(p => (
            <button
              key={p}
              onClick={() => setPhase(p)}
              className={clsx(
                'px-2.5 py-1 rounded text-[11px] font-mono border transition-all',
                phase === p
                  ? 'bg-subtle border-gray-500 text-primary'
                  : 'border-default text-muted hover:text-secondary'
              )}
            >
              {p}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted">Sort:</span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="bg-card border border-default text-secondary text-xs rounded px-2 py-1 outline-none focus:border-gray-500"
            >
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-64">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-full bg-subtle" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-subtle rounded w-3/4" />
                  <div className="h-3 bg-subtle rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : ideas.length === 0 ? (
        <div className="card p-16 text-center">
          <Zap size={32} className="text-muted mx-auto mb-3" />
          <div className="text-secondary text-sm">No opportunities match your filters</div>
          <button onClick={() => { setIndustry('All'); setPhase('All'); setSearch(''); }} className="text-brand text-xs mt-2 hover:underline">
            Clear filters
          </button>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ideas.map(idea => <IdeaCard key={idea._id} idea={idea} />)}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
