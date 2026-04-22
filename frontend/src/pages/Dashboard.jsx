import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  TrendingUp, Radio, Lightbulb, Zap, ArrowUpRight,
  BarChart2, Globe, AlertTriangle
} from 'lucide-react';
import { ideasAPI, signalsAPI, analyticsAPI } from '../utils/api';
import ScoreRing from '../components/common/ScoreRing';
import { formatDistanceToNow } from 'date-fns';

const PHASE_CLASS = {
  Emerging: 'emerging', Growing: 'growing', Peak: 'peak', Declining: 'declining'
};

function StatCard({ label, value, sub, icon: Icon, color = '#00ff88', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="card p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ background: color + '18' }}>
          <Icon size={16} style={{ color }} />
        </div>
        <ArrowUpRight size={12} className="text-gray-600" />
      </div>
      <div className="font-display font-bold text-2xl text-white">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color }}>{sub}</div>}
    </motion.div>
  );
}

function SignalBubble({ signal, onClick }) {
  const size = 60 + signal.scoring.compositeScore * 80;
  const color = signal.scoring.compositeScore > 0.8 ? '#00ff88'
    : signal.scoring.compositeScore > 0.6 ? '#00d4ff' : '#ff9900';
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.96 }}
      className="absolute rounded-full flex items-center justify-center text-center cursor-pointer border transition-all"
      style={{
        width: size, height: size,
        background: color + '12',
        borderColor: color + '44',
        boxShadow: `0 0 20px ${color}22`,
        left: `${10 + Math.random() * 70}%`,
        top: `${10 + Math.random() * 70}%`,
      }}
      title={signal.title}
    >
      <span className="text-[9px] font-mono px-1 leading-tight" style={{ color }}>
        {signal.categorization?.industry?.split(' ')[0] || 'Signal'}
      </span>
    </motion.button>
  );
}

function IdeaCard({ idea, index }) {
  const navigate = useNavigate();
  const score = idea.scoring?.opportunityScore || 0;
  const phase = idea.scoring?.trendPhase || 'Emerging';

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      onClick={() => navigate(`/app/ideas/${idea._id}`)}
      className="card p-4 cursor-pointer glass-hover"
    >
      <div className="flex items-start gap-4">
        <ScoreRing score={score} size={52} strokeWidth={3} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`phase-badge ${PHASE_CLASS[phase]}`}>{phase}</span>
            <span className="text-[10px] font-mono text-gray-600">
              {idea.category?.industry}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-gray-100 leading-snug line-clamp-2">{idea.title}</h3>
          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{idea.tagline}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] font-mono text-gray-600">{idea.views || 0} views</span>
            <span className="text-[10px] font-mono text-gray-600">{idea.saves || 0} saves</span>
            {idea.evidence?.marketData?.tam && (
              <span className="text-[10px] font-mono text-neon-green">TAM {idea.evidence.marketData.tam}</span>
            )}
          </div>
        </div>
        <ArrowUpRight size={14} className="text-gray-600 flex-shrink-0 mt-1" />
      </div>
    </motion.div>
  );
}

// Deterministic bubble positions seeded from index to avoid hydration issues
function getBubbleStyle(signal, index) {
  const score = signal.scoring?.compositeScore || 0.5;
  const size = 55 + score * 75;
  const color = score > 0.8 ? '#00ff88' : score > 0.6 ? '#00d4ff' : '#ff9900';
  const positions = [
    [12, 15], [38, 8], [62, 20], [80, 12],
    [20, 55], [50, 45], [72, 60], [30, 75],
    [88, 40], [5, 80],
  ];
  const [left, top] = positions[index % positions.length];
  return { size, color, left, top };
}

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: analyticsData } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => analyticsAPI.overview().then(r => r.data),
  });

  const { data: ideasData } = useQuery({
    queryKey: ['ideas', 'featured'],
    queryFn: () => ideasAPI.list({ limit: 6, sort: '-scoring.opportunityScore', featured: 'true' }).then(r => r.data),
  });

  const { data: signalsData } = useQuery({
    queryKey: ['signals', 'heatmap'],
    queryFn: () => signalsAPI.heatmap().then(r => r.data),
  });

  const { data: trendingData } = useQuery({
    queryKey: ['signals', 'trending'],
    queryFn: () => signalsAPI.trending().then(r => r.data),
  });

  const ideas = ideasData?.ideas || [];
  const trending = trendingData?.trending || [];
  const heatmap = signalsData?.heatmap || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          <span className="text-xs font-mono text-neon-green tracking-widest uppercase">Intelligence Feed Active</span>
        </div>
        <h1 className="font-display font-bold text-2xl text-white">Global Signal Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Real-time problem detection across {analyticsData?.totalSignals?.toLocaleString() || '—'} signals
        </p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Signals Ingested" value={analyticsData?.totalSignals?.toLocaleString() || '—'} sub="↑ +248 today" icon={Radio} color="#00ff88" delay={0} />
        <StatCard label="Active Opportunities" value={analyticsData?.totalIdeas?.toLocaleString() || '—'} sub="3 new this week" icon={Lightbulb} color="#00d4ff" delay={0.05} />
        <StatCard label="Trend Clusters" value={heatmap.length || '—'} sub="8 emerging" icon={BarChart2} color="#bf00ff" delay={0.1} />
        <StatCard label="Top Industry" value={analyticsData?.topIndustries?.[0]?._id || 'FinTech'} sub="Highest signal volume" icon={TrendingUp} color="#ff9900" delay={0.15} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Signal Heatmap - bubble viz */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="lg:col-span-1 card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Globe size={14} className="text-neon-green" />
              Signal Heatmap
            </h2>
            <span className="text-[10px] font-mono text-gray-600">LIVE</span>
          </div>
          <div className="relative" style={{ height: 220 }}>
            {trending.slice(0, 8).map((signal, i) => {
              const { size, color, left, top } = getBubbleStyle(signal, i);
              return (
                <motion.button
                  key={signal._id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.06, type: 'spring', stiffness: 200 }}
                  whileHover={{ scale: 1.12 }}
                  onClick={() => navigate('/app/signals')}
                  className="absolute rounded-full flex items-center justify-center text-center border"
                  style={{
                    width: size, height: size,
                    background: color + '14',
                    borderColor: color + '40',
                    boxShadow: `0 0 16px ${color}20`,
                    left: `${left}%`, top: `${top}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  title={signal.title}
                >
                  <span className="text-[8px] font-mono px-1 leading-tight" style={{ color }}>
                    {(signal.categorization?.industry || 'Signal').split(' ')[0].substring(0, 6)}
                  </span>
                </motion.button>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-2 pt-3 border-t border-surface-3">
            {[['#00ff88', 'High'], ['#00d4ff', 'Medium'], ['#ff9900', 'Low']].map(([c, l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                <span className="text-[10px] text-gray-600">{l}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Opportunities */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Zap size={14} className="text-neon-green" />
              Top Opportunities
            </h2>
            <button onClick={() => navigate('/app/ideas')} className="text-xs text-neon-green hover:underline flex items-center gap-1">
              View all <ArrowUpRight size={11} />
            </button>
          </div>
          {ideas.length === 0 ? (
            <div className="card p-8 text-center text-gray-600 text-sm">
              Loading opportunities...
            </div>
          ) : (
            ideas.slice(0, 4).map((idea, i) => <IdeaCard key={idea._id} idea={idea} index={i} />)
          )}
        </div>
      </div>

      {/* Trending signals strip */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <AlertTriangle size={14} className="text-yellow-500" />
            High-Friction Signals
          </h2>
          <button onClick={() => navigate('/app/signals')} className="text-xs text-neon-green hover:underline flex items-center gap-1">
            View all <ArrowUpRight size={11} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {trending.slice(0, 4).map((signal, i) => (
            <motion.div
              key={signal._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate('/app/signals')}
              className="card p-4 cursor-pointer glass-hover"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-3 text-gray-400">
                  {signal.source?.type || 'news'}
                </span>
                <span className="text-[10px] font-mono text-neon-green">
                  {Math.round((signal.scoring?.compositeScore || 0.5) * 100)}
                </span>
              </div>
              <p className="text-xs font-medium text-gray-200 leading-snug line-clamp-2">{signal.title}</p>
              <div className="mt-2 text-[10px] text-gray-600">
                {signal.categorization?.industry}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Industry breakdown */}
      {analyticsData?.topIndustries?.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
            <BarChart2 size={14} className="text-neon-blue" />
            Industry Signal Breakdown
          </h2>
          <div className="card p-5">
            <div className="space-y-3">
              {analyticsData.topIndustries.slice(0, 6).map((ind, i) => {
                const max = analyticsData.topIndustries[0]?.count || 1;
                const pct = Math.round((ind.count / max) * 100);
                const colors = ['#00ff88', '#00d4ff', '#bf00ff', '#ff9900', '#ff6b00', '#ff4444'];
                return (
                  <div key={ind._id} className="flex items-center gap-3">
                    <div className="w-28 text-xs text-gray-400 truncate font-mono">{ind._id || 'General'}</div>
                    <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: i * 0.05 + 0.3, duration: 0.6 }}
                        className="h-full rounded-full"
                        style={{ background: colors[i % colors.length] }}
                      />
                    </div>
                    <div className="w-8 text-right text-[10px] font-mono text-gray-500">{ind.count}</div>
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
