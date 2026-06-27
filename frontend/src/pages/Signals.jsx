import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Radio, TrendingUp, AlertCircle, Filter } from 'lucide-react';
import { signalsAPI } from '../utils/api';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

const SOURCES = ['All', 'news', 'reddit', 'rss', 'regulatory'];
const SOURCE_COLORS = { news: '#7C93A8', reddit: '#C2925A', rss: '#6FA08A', regulatory: '#8F86A8', review: '#C2925A' };

export default function Signals() {
  const [source, setSource] = useState('All');
  const [minScore, setMinScore] = useState(0);

  const params = {
    limit: 40,
    ...(source !== 'All' && { sourceType: source }),
    ...(minScore > 0 && { minScore: minScore / 100 }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['signals', params],
    queryFn: () => signalsAPI.list(params).then(r => r.data),
    refetchInterval: 30000,
  });

  const signals = data?.signals || [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="node node-pulse w-2 h-2" />
          <span className="text-xs font-mono text-cyan tracking-widest">LIVE · Intelligence Feed</span>
        </div>
        <h1 className="font-display font-bold text-2xl text-primary">Global Signals</h1>
        <p className="text-sm text-secondary mt-1">
          <span className="font-mono text-cyan font-semibold">{data?.pagination?.total?.toLocaleString() || '—'}</span> signals ingested · verified across <span className="font-mono text-secondary">{SOURCES.length - 1}</span> source types
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 text-xs font-mono text-muted uppercase tracking-wider"><Filter size={12} /> Source:</div>
        {SOURCES.map(s => (
          <button
            key={s}
            onClick={() => setSource(s)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-xs font-mono font-medium border transition-all',
              source === s
                ? 'bg-cyan/10 border-cyan/40 text-cyan glow-cyan'
                : 'bg-surface border-default text-muted hover:text-secondary'
            )}
          >
            {s === 'All' ? 'All Sources' : s}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-xs font-mono text-secondary">
          <span>Min score: <span className="text-cyan">{minScore}</span></span>
          <input type="range" min="0" max="90" step="10" value={minScore} onChange={e => setMinScore(+e.target.value)}
            className="w-20 accent-cyan" />
        </div>
      </div>

      {/* Signal list */}
      <div className="space-y-3">
        {isLoading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse h-20">
              <div className="flex gap-3"><div className="w-8 h-8 bg-surface-3 rounded-full" /><div className="flex-1 space-y-2"><div className="h-3 bg-surface-3 rounded w-3/4" /><div className="h-2 bg-surface-3 rounded w-1/2" /></div></div>
            </div>
          ))
        ) : signals.length === 0 ? (
          <div className="card p-12 text-center">
            <Radio size={32} className="text-muted mx-auto mb-3" />
            <p className="text-sm text-secondary">No signals match your filters</p>
          </div>
        ) : signals.map((signal, i) => {
          const score = Math.round((signal.scoring?.compositeScore || 0.5) * 100);
          const color = SOURCE_COLORS[signal.source?.type] || '#8b9ab0';
          const pain = signal.analysis?.painIntensity || 0;
          const sourceCount = signal.scoring?.sourceCount || signal.sources?.length || signal.evidence?.sourceCount;

          return (
            <motion.div
              key={signal._id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="card card-hover p-4"
            >
              <div className="flex items-start gap-4">
                {/* Source indicator */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}99` }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wide" style={{ background: color + '18', color }}>
                      {signal.source?.type}
                    </span>
                    <span className="chip chip-verified text-[10px]">Verified</span>
                    {sourceCount > 0 && (
                      <span className="chip chip-live text-[10px] font-mono">
                        {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}
                      </span>
                    )}
                    {signal.source?.name && (
                      <span className="text-[10px] text-muted font-mono">{signal.source.name}</span>
                    )}
                    {signal.categorization?.industry && (
                      <span className="text-[10px] text-secondary bg-subtle px-1.5 py-0.5 rounded-full">
                        {signal.categorization.industry}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-primary leading-snug">{signal.title}</h3>
                  {signal.summary && (
                    <p className="text-xs text-secondary mt-1 line-clamp-2">{signal.summary}</p>
                  )}
                </div>

                {/* Score */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className="text-lg font-display font-bold leading-none" style={{ color: score >= 80 ? '#6FA08A' : score >= 60 ? '#7C93A8' : '#C2925A' }}>
                    {score}
                  </div>
                  <div className="text-[9px] font-mono text-muted uppercase tracking-wider">score</div>
                  {pain > 0.7 && (
                    <div className="flex items-center gap-0.5 text-[9px] text-danger font-mono">
                      <AlertCircle size={8} /> {Math.round(pain * 100)}%
                    </div>
                  )}
                </div>
              </div>

              {/* Pain intensity bar */}
              {pain > 0 && (
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-[9px] font-mono text-muted w-16 uppercase tracking-wider">Pain</span>
                  <div className="flex-1 h-0.5 bg-subtle rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${pain * 100}%` }}
                      transition={{ duration: 0.6, delay: i * 0.02 }}
                      className="h-full rounded-full"
                      style={{ background: pain > 0.8 ? '#B47A66' : pain > 0.6 ? '#C2925A' : '#7C93A8' }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-muted">{Math.round(pain * 100)}%</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
