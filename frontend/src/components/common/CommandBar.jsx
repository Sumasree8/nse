import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Lightbulb, Radio, Hammer, BookMarked, LayoutDashboard, X, ArrowRight } from 'lucide-react';

const COMMANDS = [
  { id: 'dashboard', label: 'Go to Dashboard',       icon: LayoutDashboard, path: '/app',                     category: 'Navigate' },
  { id: 'ideas',     label: 'Browse Opportunities',  icon: Lightbulb,       path: '/app/ideas',               category: 'Navigate' },
  { id: 'signals',   label: 'View Live Signals',     icon: Radio,           path: '/app/signals',             category: 'Navigate' },
  { id: 'builder',   label: 'Open Builder Mode',     icon: Hammer,          path: '/app/builder',             category: 'Navigate' },
  { id: 'watchlist', label: 'My Watchlist',          icon: BookMarked,      path: '/app/watchlist',           category: 'Navigate' },
  { id: 'g-fintech', label: 'Generate FinTech Idea', icon: Lightbulb,       path: '/app/builder?industry=FinTech',      category: 'Generate' },
  { id: 'g-health',  label: 'Generate HealthTech',   icon: Lightbulb,       path: '/app/builder?industry=HealthTech',   category: 'Generate' },
  { id: 'g-ai',      label: 'Generate AI/ML Idea',   icon: Lightbulb,       path: '/app/builder?industry=AI+%2F+ML',    category: 'Generate' },
  { id: 'g-climate', label: 'Generate Climate Tech', icon: Lightbulb,       path: '/app/builder?industry=Climate+Tech', category: 'Generate' },
];

export default function CommandBar() {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState('');
  const [selected, setSelected] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    const onKey   = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(v => !v); }
      if (e.key === 'Escape') setOpen(false);
    };
    const onEvent = () => setOpen(true);
    document.addEventListener('keydown', onKey);
    document.addEventListener('openCommandBar', onEvent);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('openCommandBar', onEvent); };
  }, []);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);

  const filtered = COMMANDS.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (cmd) => { navigate(cmd.path); setOpen(false); setQuery(''); };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(v => Math.min(v + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(v => Math.max(v - 1, 0)); }
    if (e.key === 'Enter' && filtered[selected]) handleSelect(filtered[selected]);
  };

  const grouped = filtered.reduce((acc, cmd) => {
    (acc[cmd.category] = acc[cmd.category] || []).push(cmd);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="command-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-lg mx-4 card overflow-hidden"
            style={{ boxShadow: 'var(--shadow-md)' }}
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-default">
              <Search size={15} className="text-muted flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Search commands, industries, ideas..."
                className="flex-1 bg-transparent text-primary text-sm outline-none placeholder-muted font-sans"
              />
              <button onClick={() => setOpen(false)} className="text-muted hover:text-secondary transition-colors">
                <X size={14} />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-72 overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-muted text-sm">No commands found</div>
              ) : (
                Object.entries(grouped).map(([category, cmds]) => (
                  <div key={category}>
                    <div className="px-4 py-1.5 text-[10px] font-mono font-semibold text-muted uppercase tracking-widest">
                      {category}
                    </div>
                    {cmds.map((cmd) => {
                      const globalIdx = filtered.indexOf(cmd);
                      const Icon = cmd.icon;
                      const isActive = globalIdx === selected;
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => handleSelect(cmd)}
                          onMouseEnter={() => setSelected(globalIdx)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                          style={{ background: isActive ? 'var(--brand-bg)' : 'transparent' }}
                        >
                          <Icon size={14} style={{ color: isActive ? 'var(--brand)' : 'var(--text-muted)' }} />
                          <span className="flex-1 text-sm" style={{ color: isActive ? 'var(--brand)' : 'var(--text-secondary)' }}>
                            {cmd.label}
                          </span>
                          {isActive && <ArrowRight size={12} style={{ color: 'var(--brand)' }} />}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hints */}
            <div className="px-4 py-2 border-t border-default flex items-center gap-4 text-[10px] font-mono text-muted">
              <span><kbd className="bg-subtle px-1 rounded">↑↓</kbd> navigate</span>
              <span><kbd className="bg-subtle px-1 rounded">↵</kbd> select</span>
              <span><kbd className="bg-subtle px-1 rounded">esc</kbd> close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
