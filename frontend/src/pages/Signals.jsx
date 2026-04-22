import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Radio, TrendingUp, AlertCircle, Filter } from 'lucide-react';
import { signalsAPI } from '../utils/api';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

const SOURCES = ['All', 'news', 'reddit', 'rss', 'regulatory'];
const SOURCE_COLORS = { news: '#00d4ff', reddit: '#ff6b00', rss: '#00ff88', regulatory: '#bf00ff', review: '#ff9900' };

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
          <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          <span className="text-xs font-mono text-neon-green tracking-widest">Live Intelligence Feed</span>
        </div>
        <h1 className="font-display font-bold text-2xl text-white">Global Signals</h1>
        <p className="text-sm text-gray-500 mt-1">
          {data?.pagination?.total?.toLocaleString() || '—'} signals ingested from {SOURCES.length - 1} source types
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 text-xs text-gray-600"><Filter size={12} /> Source:</div>
        {SOURCES.map(s => (
          <button
            key={s}
            onClick={() => setSource(s)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
              source === s
                ? 'bg-neon-green/10 border-neon-green/40 text-neon-green'
                : 'bg-surface-2 border-surface-3 text-gray-500 hover:text-gray-300'
            )}
          >
            {s === 'All' ? 'All Sources' : s}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
          <span>Min score: {minScore}</span>
          <input type="range" min="0" max="90" step="10" value={minScore} onChange={e => setMinScore(+e.target.value)}
            className="w-20 accent-neon-green" />
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
            <Radio size={32} className="text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-600">No signals match your filters</p>
          </div>
        ) : signals.map((signal, i) => {
          const score = Math.round((signal.scoring?.compositeScore || 0.5) * 100);
          const color = SOURCE_COLORS[signal.source?.type] || '#8b9ab0';
          const pain = signal.analysis?.painIntensity || 0;

          return (
            <motion.div
              key={signal._id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="card p-4 glass-hover"
            >
              <div className="flex items-start gap-4">
                {/* Source indicator */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}66` }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: color + '18', color }}>
                      {signal.source?.type}
                    </span>
                    {signal.source?.name && (
                      <span className="text-[10px] text-gray-600 font-mono">{signal.source.name}</span>
                    )}
                    {signal.categorization?.industry && (
                      <span className="text-[10px] text-gray-600 bg-surface-3 px-1.5 py-0.5 rounded-full">
                        {signal.categorization.industry}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-gray-200 leading-snug">{signal.title}</h3>
                  {signal.summary && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{signal.summary}</p>
                  )}
                </div>

                {/* Score */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className="text-sm font-mono font-bold" style={{ color: score >= 80 ? '#00ff88' : score >= 60 ? '#00d4ff' : '#ff9900' }}>
                    {score}
                  </div>
                  <div className="text-[9px] font-mono text-gray-600">score</div>
                  {pain > 0.7 && (
                    <div className="flex items-center gap-0.5 text-[9px] text-red-400 font-mono">
                      <AlertCircle size={8} /> {Math.round(pain * 100)}%
                    </div>
                  )}
                </div>
              </div>

              {/* Pain intensity bar */}
              {pain > 0 && (
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-[9px] font-mono text-gray-600 w-16">Pain</span>
                  <div className="flex-1 h-0.5 bg-surface-3 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${pain * 100}%` }}
                      transition={{ duration: 0.6, delay: i * 0.02 }}
                      className="h-full rounded-full"
                      style={{ background: pain > 0.8 ? '#ff4444' : pain > 0.6 ? '#ff9900' : '#00d4ff' }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-gray-600">{Math.round(pain * 100)}%</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
