import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { Zap, Wand2, CheckSquare, Square, ChevronRight, Loader, AlertCircle } from 'lucide-react';
import { ideasAPI } from '../utils/api';
import ScoreRing from '../components/common/ScoreRing';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const INDUSTRIES = [
  'FinTech', 'HealthTech', 'Supply Chain', 'HR Tech', 'Legal Tech',
  'E-Commerce', 'Climate Tech', 'Restaurant Tech', 'Construction',
  'AI / ML', 'EdTech', 'PropTech', 'AgriTech', 'CyberSecurity',
];

const FUNDING_MODELS = [
  { value: 'bootstrapped', label: '🥾 Bootstrapped', desc: 'Revenue-first, lean' },
  { value: 'venture', label: '🚀 VC Scale', desc: 'Growth-first, funded' },
];

// Blueprint dimensions the studio synthesizes per generation
const BLUEPRINT_DIMENSIONS = [
  'Problem', 'Target Users', 'Market Size', 'Competitors', 'Differentiation',
  'Business Model', 'Pricing', '72-Hour MVP', 'Launch Checklist', 'Go-To-Market',
];

function Checklist({ idea }) {
  const [checked, setChecked] = useState({});
  const steps = [
    { id: 'read', label: 'Read the full opportunity analysis', auto: false },
    { id: 'evidence', label: 'Review Reddit & news evidence', auto: false },
    { id: 'competitors', label: 'Study competitor gap map', auto: false },
    { id: 'stack', label: 'Review recommended tech stack', auto: false },
    { id: 'persona', label: 'Identify target persona', auto: false },
    { id: 'landing', label: 'Draft landing page copy', auto: false },
    { id: 'validate', label: 'Run smoke test / waitlist', auto: false },
    { id: 'build', label: 'Start 72-hour MVP build', auto: false },
  ];

  const completed = Object.values(checked).filter(Boolean).length;

  return (
    <div className="card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-display font-semibold text-primary">Launch Checklist</h3>
        <span className="text-[10px] font-mono text-violet">{completed}/{steps.length}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-surface-3 rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full bg-violet rounded-full"
          animate={{ width: `${(completed / steps.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="space-y-2">
        {steps.map((step, i) => (
          <motion.button
            key={step.id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => setChecked(c => ({ ...c, [step.id]: !c[step.id] }))}
            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-3 transition-colors text-left"
          >
            {checked[step.id]
              ? <CheckSquare size={14} className="text-violet flex-shrink-0" />
              : <Square size={14} className="text-muted flex-shrink-0" />
            }
            <span className={clsx('text-xs transition-all', checked[step.id] ? 'text-muted line-through' : 'text-secondary')}>
              {step.label}
            </span>
          </motion.button>
        ))}
      </div>

      {completed === steps.length && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-3 bg-violet/10 border border-violet/30 rounded-lg text-center glow-violet"
        >
          <div className="text-violet text-sm font-display font-semibold">🚀 Ready to launch!</div>
          <div className="text-xs text-secondary mt-1">You've completed all pre-launch steps</div>
        </motion.div>
      )}
    </div>
  );
}

export default function Builder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [industry, setIndustry] = useState(searchParams.get('industry') || '');
  const [fundingModel, setFundingModel] = useState('bootstrapped');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedIdea, setGeneratedIdea] = useState(null);

  const { mutate: generate, isPending } = useMutation({
    mutationFn: () => ideasAPI.generate({ industry, fundingModel, customPrompt }),
    onSuccess: (res) => {
      setGeneratedIdea(res.data.idea);
      toast.success('Blueprint generated successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Generation failed. Please login to generate ideas.');
    },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="node node-violet node-pulse w-2 h-2" />
          <Wand2 size={16} className="text-violet" />
          <span className="text-xs font-mono text-violet tracking-widest uppercase">AI Startup Studio</span>
        </div>
        <h1 className="font-display font-bold text-2xl gradient-text">Generate Your Startup Blueprint</h1>
        <p className="text-sm text-secondary mt-1">
          One prompt &rarr; a full blueprint: problem, users, market, competitors, differentiation, business model, pricing, a 72-hour MVP, launch checklist, and go-to-market.
        </p>
      </div>

      {/* Config panel */}
      <div className="card p-6 space-y-5">
        {/* Industry */}
        <div>
          <label className="text-xs font-mono uppercase text-muted tracking-widest mb-2 block">Target Industry</label>
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map(ind => (
              <button
                key={ind}
                onClick={() => setIndustry(ind === industry ? '' : ind)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                  industry === ind
                    ? 'bg-violet/15 border-violet/40 text-violet'
                    : 'bg-surface border-default text-muted hover:text-primary hover:border-strong'
                )}
              >
                {ind}
              </button>
            ))}
          </div>
        </div>

        {/* Funding model */}
        <div>
          <label className="text-xs font-mono uppercase text-muted tracking-widest mb-2 block">Funding Model</label>
          <div className="flex gap-3">
            {FUNDING_MODELS.map(fm => (
              <button
                key={fm.value}
                onClick={() => setFundingModel(fm.value)}
                className={clsx(
                  'flex-1 p-3 rounded-lg border text-left transition-all',
                  fundingModel === fm.value
                    ? 'bg-violet/10 border-violet/40'
                    : 'bg-surface border-default hover:border-strong'
                )}
              >
                <div className={clsx('text-sm font-medium', fundingModel === fm.value ? 'text-violet' : 'text-secondary')}>{fm.label}</div>
                <div className="text-[10px] text-muted mt-0.5">{fm.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom prompt */}
        <div>
          <label className="text-xs font-mono uppercase text-muted tracking-widest mb-2 block">
            Custom Direction <span className="text-muted normal-case">(optional)</span>
          </label>
          <textarea
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            placeholder="e.g. 'Focus on solo founders, low technical complexity, ideally marketplace model...' or leave blank for the AI to decide"
            rows={3}
            className="input-field resize-none text-xs"
          />
        </div>

        {/* Blueprint preview chips */}
        <div>
          <label className="text-xs font-mono uppercase text-muted tracking-widest mb-2 block">Blueprint Includes</label>
          <div className="flex flex-wrap gap-1.5">
            {BLUEPRINT_DIMENSIONS.map(dim => (
              <span key={dim} className="chip chip-ai text-[10px]">{dim}</span>
            ))}
          </div>
        </div>

        <button
          onClick={() => generate()}
          disabled={isPending}
          className="btn-primary w-full justify-center py-3"
        >
          {isPending ? (
            <>
              <Loader size={14} className="animate-spin" />
              Synthesizing blueprint...
            </>
          ) : (
            <>
              <Zap size={14} />
              Generate Startup Blueprint
            </>
          )}
        </button>

        <p className="text-[10px] text-muted text-center font-mono">
          Powered by AI &middot; Takes 10&ndash;20 seconds &middot; Free tier: 5 blueprints/month.
        </p>
      </div>

      {/* Generating state */}
      {isPending && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-10 text-center glow-violet border-violet/30"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="node node-violet node-pulse w-3 h-3" />
            <Loader size={28} className="text-violet animate-spin" />
            <span className="node node-violet node-pulse w-3 h-3" />
          </div>
          <p className="text-sm font-display text-primary">Synthesizing your full startup blueprint</p>
          <p className="text-xs text-secondary mt-1 font-mono">
            Mapping problem &rarr; users &rarr; market &rarr; competitors &rarr; MVP &rarr; GTM
          </p>
        </motion.div>
      )}

      {/* Results - split screen */}
      <AnimatePresence>
        {generatedIdea && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Left: Pitch */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="node node-violet w-2 h-2" />
                  <h2 className="text-sm font-display font-semibold text-primary">Generated Blueprint</h2>
                </div>
                <button
                  onClick={() => navigate(`/app/ideas/${generatedIdea._id}`)}
                  className="text-xs text-violet hover:underline flex items-center gap-1"
                >
                  Full analysis <ChevronRight size={11} />
                </button>
              </div>

              <div className="card p-5 glow-violet">
                <div className="flex items-start gap-4 mb-4">
                  <ScoreRing score={generatedIdea.scoring?.opportunityScore || 0} size={64} strokeWidth={4} />
                  <div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {generatedIdea.scoring?.trendPhase && (
                        <span className={`phase-badge ${generatedIdea.scoring.trendPhase.toLowerCase()}`}>
                          {generatedIdea.scoring.trendPhase}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-muted">{generatedIdea.category?.industry}</span>
                    </div>
                    <h3 className="text-base font-display font-bold text-primary leading-snug">{generatedIdea.title}</h3>
                    <p className="text-xs text-secondary mt-1">{generatedIdea.tagline}</p>
                  </div>
                </div>

                {generatedIdea.problemStatement && (
                  <div className="p-3 bg-surface rounded-lg border border-default mb-3">
                    <div className="text-[9px] font-mono uppercase text-muted mb-1">Problem</div>
                    <p className="text-xs text-secondary leading-relaxed">{generatedIdea.problemStatement}</p>
                  </div>
                )}

                {generatedIdea.solution && (
                  <div className="p-3 bg-violet/5 rounded-lg border border-violet/15">
                    <div className="text-[9px] font-mono uppercase text-muted mb-1">Solution</div>
                    <p className="text-xs text-secondary leading-relaxed">{generatedIdea.solution}</p>
                  </div>
                )}
              </div>

              {/* Why Now */}
              {generatedIdea.whyNow?.triggers?.length > 0 && (
                <div className="card p-4">
                  <div className="text-xs font-mono uppercase text-muted mb-2">Why Now</div>
                  <div className="space-y-1.5">
                    {generatedIdea.whyNow.triggers.slice(0, 3).map((t, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-secondary">
                        <ChevronRight size={11} className="text-violet mt-0.5 flex-shrink-0" />{t}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence snippet */}
              {generatedIdea.evidence?.redditQuotes?.[0] && (
                <div className="card p-4 border-l-2 border-cyan/40">
                  <div className="text-[9px] font-mono uppercase text-muted mb-1.5">Evidence from Reddit</div>
                  <p className="text-xs text-secondary italic">"{generatedIdea.evidence.redditQuotes[0].text}"</p>
                  <div className="text-[9px] font-mono text-cyan mt-1">{generatedIdea.evidence.redditQuotes[0].subreddit}</div>
                </div>
              )}

              {/* Market data */}
              {generatedIdea.evidence?.marketData && (
                <div className="card p-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[['TAM', generatedIdea.evidence.marketData.tam], ['SAM', generatedIdea.evidence.marketData.sam], ['SOM', generatedIdea.evidence.marketData.som]].map(([l, v]) => (
                      <div key={l}>
                        <div className="text-[9px] font-mono text-muted">{l}</div>
                        <div className="text-sm font-display font-bold text-violet font-mono">{v || '—'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Checklist */}
            <div>
              <h2 className="text-sm font-display font-semibold text-primary mb-4">Launch Checklist</h2>
              <Checklist idea={generatedIdea} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!generatedIdea && !isPending && (
        <div className="card p-12 text-center border-dashed border-strong">
          <Wand2 size={32} className="text-violet/60 mx-auto mb-3" />
          <p className="text-sm text-secondary">Configure parameters above and click Generate to synthesize your full startup blueprint</p>
          <p className="text-xs text-muted mt-2 font-mono">Each blueprint includes: problem &middot; users &middot; market &middot; competitors &middot; differentiation &middot; business model &middot; pricing &middot; 72-hour MVP &middot; launch checklist &middot; GTM</p>
        </div>
      )}
    </div>
  );
}
