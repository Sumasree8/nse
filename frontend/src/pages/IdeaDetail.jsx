import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Bookmark, Share2, ExternalLink, ChevronRight,
  AlertTriangle, CheckCircle, Clock, Target, Users, TrendingUp,
  FileText, Zap, Shield, Eye, MessageSquare
} from 'lucide-react';
import { ideasAPI, validationAPI, formatMarketSize } from '../utils/api';
import ScoreRing from '../components/common/ScoreRing';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'evidence', label: 'Evidence', icon: FileText },
  { id: 'execution', label: 'MVP Plan', icon: Zap },
  { id: 'validation', label: 'Validation', icon: Shield },
  { id: 'personas', label: 'Personas', icon: Users },
];

function ScoreBar({ label, score, weight, color }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-secondary">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-muted font-mono text-[10px]">×{weight}</span>
          <span className="font-mono" style={{ color }}>{score}</span>
        </div>
      </div>
      <div className="h-1.5 bg-subtle rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

function PivotSlider({ value, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-mono text-secondary">
        <span>Bootstrapped</span>
        <span>VC Scale</span>
      </div>
      <input
        type="range" min="0" max="100" value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ background: `linear-gradient(to right, var(--brand) ${value}%, var(--border) ${value}%)` }}
      />
      <div className="text-center text-xs font-mono text-secondary">
        {value < 33 ? '🥾 Bootstrapped Mode' : value < 66 ? '⚡ Hybrid Growth' : '🚀 VC Scale Mode'}
      </div>
    </div>
  );
}

function EvidenceTab({ idea }) {
  const quotes = idea.evidence?.redditQuotes || [];
  const citations = idea.evidence?.newsCitations || [];
  const market = idea.evidence?.marketData;

  return (
    <div className="space-y-6">
      {/* Market data */}
      {market && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-brand" /> Market Size
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {[['TAM', formatMarketSize(market.tam), 'var(--success)'], ['SAM', formatMarketSize(market.sam), 'var(--info)'], ['SOM', formatMarketSize(market.som), '#8b5cf6']].map(([label, val, color]) => (
              <div key={label} className="text-center p-3 bg-card rounded-lg border border-default">
                <div className="text-[10px] font-mono text-secondary mb-1">{label}</div>
                <div className="text-lg font-bold font-display" style={{ color }}>{val || '—'}</div>
              </div>
            ))}
          </div>
          {market.growthRate && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-secondary">CAGR:</span>
              <span className="text-brand font-mono font-semibold">{market.growthRate}</span>
            </div>
          )}
        </div>
      )}

      {/* Reddit quotes */}
      {quotes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
            <MessageSquare size={14} className="text-accent-500" /> Reddit Evidence
            <span className="text-[10px] font-mono text-muted">{quotes.length} quotes</span>
          </h3>
          {quotes.map((q, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className="card p-4 border-l-2 border-orange-400/40">
              <p className="text-sm text-primary leading-relaxed italic">"{q.text}"</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px] font-mono text-accent-500">{q.subreddit}</span>
                <span className="text-[10px] font-mono text-muted">↑ {q.upvotes?.toLocaleString()}</span>
                <span className={clsx('text-[10px] font-mono', q.sentiment === 'negative' ? 'text-danger' : 'text-warning')}>
                  {q.sentiment}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* News citations */}
      {citations.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
            <FileText size={14} className="text-info" /> News Citations
          </h3>
          {citations.map((c, i) => (
            <div key={i} className="card p-3 flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-primary">{c.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono text-info">{c.source}</span>
                  {c.url && (
                    <a href={c.url} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-muted hover:text-secondary flex items-center gap-1">
                      <ExternalLink size={9} />
                    </a>
                  )}
                </div>
              </div>
              {c.relevanceScore && (
                <span className="text-[10px] font-mono text-brand">{Math.round(c.relevanceScore * 100)}%</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExecutionTab({ idea, pivotValue }) {
  const isVC = pivotValue > 50;
  const plan = idea.execution?.mvpPlan;
  const smoke = idea.execution?.smokeTest;
  const biz = isVC ? idea.businessModels?.venture : idea.businessModels?.bootstrapped;

  if (!plan) return <div className="text-center py-12 text-muted text-sm">Upgrade to Pro to see the full MVP Plan</div>;

  return (
    <div className="space-y-6">
      {/* Business model */}
      {biz && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
            <Target size={14} className="text-brand" />
            {isVC ? 'VC Scale' : 'Bootstrapped'} Business Model
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(biz.pricing || []).map((tier, i) => (
              <div key={i} className="p-3 bg-card rounded-lg border border-default">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-primary">{tier.tier}</span>
                  <span className="text-sm font-bold text-brand font-mono">{tier.price}</span>
                </div>
                <ul className="space-y-1">
                  {(tier.features || []).slice(0, 4).map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-[10px] text-secondary">
                      <CheckCircle size={9} className="text-brand flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {biz.monthsToRevenue && (
            <div className="mt-3 text-xs text-secondary">
              ⏱ Time to revenue: <span className="text-warning font-mono">{biz.monthsToRevenue} months</span>
              {biz.initialCapitalRequired && <span> · Capital needed: <span className="text-brand font-mono">{biz.initialCapitalRequired}</span></span>}
            </div>
          )}
        </div>
      )}

      {/* 72-hour plan */}
      <div className="space-y-3">
        {[['0–24h', plan.hours24, 'var(--success)'], ['24–48h', plan.hours48, 'var(--info)'], ['48–72h', plan.hours72, '#8b5cf6']].map(([label, steps, color]) => (
          steps?.length > 0 && (
            <div key={label} className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={12} style={{ color }} />
                <span className="text-xs font-mono font-semibold" style={{ color }}>{label}</span>
              </div>
              <div className="space-y-2">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono flex-shrink-0 mt-0.5"
                      style={{ background: color + '20', color }}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-primary">{step.step}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(step.tools || []).map(t => (
                          <span key={t} className="text-[9px] font-mono bg-subtle text-secondary px-1.5 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                      {step.outcome && <p className="text-[10px] text-muted mt-1">→ {step.outcome}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>

      {/* Tech stack */}
      {plan.techStack && (
        <div className="card p-4">
          <h3 className="text-xs font-semibold text-primary mb-3">Recommended Tech Stack</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(plan.techStack).map(([cat, tools]) => (
              tools?.length > 0 && (
                <div key={cat}>
                  <div className="text-[9px] font-mono uppercase text-muted mb-1">{cat}</div>
                  <div className="flex flex-wrap gap-1">
                    {tools.map(t => (
                      <span key={t} className="text-[10px] font-mono bg-brand text-brand px-1.5 py-0.5 rounded border border-brand/20">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Smoke test */}
      {smoke?.landingPageCopy && (
        <div className="card p-4">
          <h3 className="text-xs font-semibold text-primary mb-3 flex items-center gap-2">
            <Zap size={12} className="text-warning" /> Landing Page Copy
          </h3>
          <div className="bg-card rounded-lg p-4 border border-default space-y-2">
            <h4 className="text-base font-bold text-white leading-snug">{smoke.landingPageCopy.headline}</h4>
            <p className="text-xs text-secondary">{smoke.landingPageCopy.subheadline}</p>
            <div className="pt-2">
              <button className="btn-primary text-xs py-2 px-4">{smoke.landingPageCopy.cta}</button>
            </div>
            <ul className="pt-2 space-y-1">
              {smoke.landingPageCopy.bullets?.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-[10px] text-secondary">
                  <CheckCircle size={9} className="text-brand" />{b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function PersonasTab({ idea }) {
  const personas = idea.execution?.personas || [];
  if (personas.length === 0) return <div className="text-center py-12 text-muted text-sm">No personas generated</div>;

  return (
    <div className="space-y-4">
      {personas.map((p, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
          className="card p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-brand border border-brand/20 flex items-center justify-center text-xl flex-shrink-0">
              {['🧑‍💼', '👩‍💻', '🧑‍🔬'][i % 3]}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white text-sm">{p.name}</div>
              <div className="text-xs text-brand font-mono">{p.role}</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[9px] font-mono uppercase text-muted mb-1">Pain Points</div>
                  <ul className="space-y-1">
                    {(p.painPoints || []).slice(0, 3).map((pt, j) => (
                      <li key={j} className="flex items-start gap-1.5 text-[10px] text-secondary">
                        <AlertTriangle size={8} className="text-danger flex-shrink-0 mt-0.5" />{pt}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[9px] font-mono uppercase text-muted mb-1">Where to Find</div>
                  <ul className="space-y-1">
                    {(p.communities || []).slice(0, 3).map((c, j) => (
                      <li key={j} className="text-[10px] text-info font-mono">{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
              {p.willingnessToPay && (
                <div className="mt-3 text-[10px] text-secondary">
                  💰 WTP: <span className="text-brand font-mono">{p.willingnessToPay}</span>
                  {p.acquisitionChannel && <span> · 📡 via {p.acquisitionChannel}</span>}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function IdeaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [pivotValue, setPivotValue] = useState(20);

  const { data: ideaData, isLoading } = useQuery({
    queryKey: ['idea', id],
    queryFn: () => ideasAPI.get(id).then(r => r.data),
  });

  const idea = ideaData?.idea;
  const score = idea?.scoring?.opportunityScore || 0;

  if (isLoading) return (
    <div className="p-6 flex items-center justify-center min-h-96">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!idea) return (
    <div className="p-6 text-center">
      <div className="text-muted">Opportunity not found</div>
      <button onClick={() => navigate('/app/ideas')} className="text-brand text-sm mt-2 hover:underline">← Back to Ideas</button>
    </div>
  );

  const handleSave = async () => {
    try { await ideasAPI.save(id); toast.success('Saved to library'); } catch { toast.error('Login required to save'); }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={() => navigate('/app/ideas')} className="flex items-center gap-2 text-xs text-secondary hover:text-primary transition-colors">
        <ArrowLeft size={13} /> Back to Opportunities
      </button>

      {/* Header card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex items-start gap-6">
          <div className="flex flex-col items-center gap-2">
            <ScoreRing score={score} size={80} strokeWidth={5} />
            <span className="text-[9px] font-mono uppercase text-muted tracking-widest">Score</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {idea.scoring?.trendPhase && (
                <span className={`phase-badge ${idea.scoring.trendPhase.toLowerCase()}`}>{idea.scoring.trendPhase}</span>
              )}
              <span className="text-xs font-mono text-secondary bg-subtle px-2 py-0.5 rounded-full">
                {idea.category?.industry}
              </span>
              {idea.risks?.overallRisk && (
                <span className={clsx('text-[10px] font-mono px-2 py-0.5 rounded-full border', {
                  'bg-green-500/10 text-green-400 border-green-500/20': idea.risks.overallRisk === 'low',
                  'bg-yellow-500/10 text-warning border-yellow-500/20': idea.risks.overallRisk === 'medium',
                  'bg-red-500/10 text-danger border-red-500/20': idea.risks.overallRisk === 'high' || idea.risks.overallRisk === 'critical',
                })}>
                  {idea.risks.overallRisk} risk
                </span>
              )}
            </div>
            <h1 className="font-display font-bold text-xl text-white leading-snug">{idea.title}</h1>
            <p className="text-sm text-secondary mt-2 leading-relaxed">{idea.tagline}</p>

            <div className="flex items-center gap-3 mt-4">
              <button onClick={handleSave} className="btn-ghost text-xs py-2">
                <Bookmark size={12} /> Save
              </button>
              <button onClick={handleShare} className="btn-ghost text-xs py-2">
                <Share2 size={12} /> Share
              </button>
              <button onClick={() => navigate('/app/builder')} className="btn-primary text-xs py-2">
                <Zap size={12} /> Build This
              </button>
            </div>
          </div>

          {/* Score breakdown */}
          {idea.scoring?.components && (
            <div className="hidden lg:block w-56 space-y-3">
              <ScoreBar label="Trend Strength" score={idea.scoring.components.trendStrength?.score || 0} weight="0.30" color="var(--success)" />
              <ScoreBar label="Pain Intensity" score={idea.scoring.components.painIntensity?.score || 0} weight="0.25" color="var(--info)" />
              <ScoreBar label="Market Size" score={idea.scoring.components.marketSize?.score || 0} weight="0.20" color="#8b5cf6" />
              <ScoreBar label="Competition" score={idea.scoring.components.competitionDensity?.score || 0} weight="0.15" color="var(--warning)" />
              <ScoreBar label="Execution" score={idea.scoring.components.executionComplexity?.score || 0} weight="0.10" color="var(--warning)" />
            </div>
          )}
        </div>

        {/* Pivot slider */}
        <div className="mt-6 pt-5 border-t border-default">
          <div className="text-xs font-semibold text-primary mb-3 flex items-center gap-2">
            ⚡ Pivot Mode
            <span className="text-[10px] font-mono text-muted">Adjust to see bootstrapped vs VC recommendations</span>
          </div>
          <PivotSlider value={pivotValue} onChange={setPivotValue} />
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-default overflow-x-auto">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-all -mb-px',
              tab === tabId
                ? 'border-brand text-brand'
                : 'border-transparent text-secondary hover:text-primary'
            )}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'overview' && (
            <div className="space-y-5">
              {idea.problemStatement && (
                <div className="card p-5">
                  <h3 className="text-xs font-mono uppercase text-muted mb-2 tracking-widest">Problem</h3>
                  <p className="text-sm text-primary leading-relaxed">{idea.problemStatement}</p>
                </div>
              )}
              {idea.solution && (
                <div className="card p-5 border-brand/20">
                  <h3 className="text-xs font-mono uppercase text-muted mb-2 tracking-widest">Solution</h3>
                  <p className="text-sm text-primary leading-relaxed">{idea.solution}</p>
                </div>
              )}
              {idea.whyNow && (
                <div className="card p-5">
                  <h3 className="text-xs font-mono uppercase text-muted mb-3 tracking-widest">Why Now</h3>
                  <div className="space-y-2">
                    {idea.whyNow.triggers?.map((t, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-primary">
                        <ChevronRight size={12} className="text-brand mt-0.5 flex-shrink-0" />{t}
                      </div>
                    ))}
                  </div>
                  {idea.whyNow.timeWindow && (
                    <div className="mt-3 text-xs font-mono text-warning bg-yellow-400/10 px-3 py-2 rounded-lg border border-yellow-400/20">
                      ⏰ Window: {idea.whyNow.timeWindow}
                    </div>
                  )}
                </div>
              )}
              {idea.competitors?.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-xs font-mono uppercase text-muted mb-3 tracking-widest">Competitor Gap Map</h3>
                  <div className="space-y-3">
                    {idea.competitors.map((c, i) => (
                      <div key={i} className="p-3 bg-card rounded-lg border border-default">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-primary">{c.name}</span>
                          <span className={clsx('text-[10px] font-mono px-2 py-0.5 rounded-full', {
                            'bg-green-500/10 text-green-400': c.riskLevel === 'low',
                            'bg-yellow-500/10 text-warning': c.riskLevel === 'medium',
                            'bg-red-500/10 text-danger': c.riskLevel === 'high',
                          })}>{c.riskLevel} threat</span>
                        </div>
                        <div className="space-y-1">
                          {(c.weaknesses || []).map((w, j) => (
                            <div key={j} className="flex items-start gap-2 text-[10px] text-secondary">
                              <AlertTriangle size={8} className="text-warning flex-shrink-0 mt-0.5" />{w}
                            </div>
                          ))}
                        </div>
                        {c.gapOpportunity && (
                          <div className="mt-2 text-[10px] text-brand bg-brand px-2 py-1 rounded border border-brand/20">
                            Gap: {c.gapOpportunity}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(idea.risks?.premortem?.length > 0 || idea.risks?.technical?.length > 0) && (
                <div className="card p-5">
                  <h3 className="text-xs font-mono uppercase text-muted mb-3 tracking-widest flex items-center gap-2">
                    <AlertTriangle size={11} className="text-danger" /> Pre-mortem Scenarios
                  </h3>
                  <div className="space-y-3">
                    {(idea.risks.premortem || []).map((r, i) => (
                      <div key={i} className="p-3 bg-red-500/5 rounded-lg border border-red-500/15">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium text-primary">{r.scenario}</p>
                          <span className="text-[10px] font-mono text-danger">{Math.round(r.probability * 100)}% prob</span>
                        </div>
                        {r.mitigation && <p className="text-[10px] text-secondary mt-1">→ {r.mitigation}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {tab === 'evidence' && <EvidenceTab idea={idea} />}
          {tab === 'execution' && <ExecutionTab idea={idea} pivotValue={pivotValue} />}
          {tab === 'personas' && <PersonasTab idea={idea} />}
          {tab === 'validation' && (
            <div className="card p-8 text-center text-muted">
              <Shield size={32} className="mx-auto mb-3 text-muted" />
              <p className="text-sm">Validation Engine available for Pro users</p>
              <button onClick={() => navigate('/pricing')} className="btn-primary text-xs mt-4">
                Upgrade to Pro
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
