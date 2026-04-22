import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Lightbulb, Radio, Hammer, BookMarked, LayoutDashboard, X, ArrowRight } from 'lucide-react';

const COMMANDS = [
  { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, path: '/app', category: 'Navigate' },
  { id: 'ideas', label: 'Browse Opportunities', icon: Lightbulb, path: '/app/ideas', category: 'Navigate' },
  { id: 'signals', label: 'View Live Signals', icon: Radio, path: '/app/signals', category: 'Navigate' },
  { id: 'builder', label: 'Open Builder Mode', icon: Hammer, path: '/app/builder', category: 'Navigate' },
  { id: 'watchlist', label: 'My Watchlist', icon: BookMarked, path: '/app/watchlist', category: 'Navigate' },
  { id: 'gen-fintech', label: 'Generate FinTech Idea', icon: Lightbulb, path: '/app/builder?industry=FinTech', category: 'Generate' },
  { id: 'gen-health', label: 'Generate HealthTech Idea', icon: Lightbulb, path: '/app/builder?industry=HealthTech', category: 'Generate' },
  { id: 'gen-ai', label: 'Generate AI/ML Idea', icon: Lightbulb, path: '/app/builder?industry=AI+%2F+ML', category: 'Generate' },
  { id: 'gen-climate', label: 'Generate Climate Tech Idea', icon: Lightbulb, path: '/app/builder?industry=Climate+Tech', category: 'Generate' },
];

export default function CommandBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(v => !v); }
      if (e.key === 'Escape') setOpen(false);
    };
    const handleEvent = () => setOpen(true);
    document.addEventListener('keydown', handleKey);
    document.addEventListener('openCommandBar', handleEvent);
    return () => { document.removeEventListener('keydown', handleKey); document.removeEventListener('openCommandBar', handleEvent); };
  }, []);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);

  const filtered = COMMANDS.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (cmd) => { navigate(cmd.path); setOpen(false); setQuery(''); };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(v => Math.min(v + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(v => Math.max(v - 1, 0)); }
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
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-lg mx-4"
            style={{ background: '#0d1117', border: '1px solid #2a3444', borderRadius: 12, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,255,136,0.1)' }}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-3">
              <Search size={15} className="text-gray-500 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Search commands, industries, ideas..."
                className="flex-1 bg-transparent text-gray-200 text-sm outline-none placeholder-gray-600 font-sans"
              />
              <button onClick={() => setOpen(false)} className="text-gray-600 hover:text-gray-400 transition-colors">
                <X size={14} />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-gray-600 text-sm">No commands found</div>
              ) : (
                Object.entries(grouped).map(([category, cmds]) => (
                  <div key={category}>
                    <div className="px-4 py-1.5 text-[10px] font-mono font-600 text-gray-600 uppercase tracking-widest">{category}</div>
                    {cmds.map((cmd) => {
                      const globalIdx = filtered.indexOf(cmd);
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => handleSelect(cmd)}
                          onMouseEnter={() => setSelected(globalIdx)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                          style={{ background: globalIdx === selected ? 'rgba(0,255,136,0.08)' : 'transparent' }}
                        >
                          <Icon size={14} className={globalIdx === selected ? 'text-neon-green' : 'text-gray-500'} />
                          <span className={`flex-1 text-sm ${globalIdx === selected ? 'text-white' : 'text-gray-400'}`}>{cmd.label}</span>
                          {globalIdx === selected && <ArrowRight size={12} className="text-neon-green" />}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="px-4 py-2 border-t border-surface-3 flex items-center gap-4 text-[10px] font-mono text-gray-600">
              <span><kbd className="bg-surface-3 px-1 rounded">↑↓</kbd> navigate</span>
              <span><kbd className="bg-surface-3 px-1 rounded">↵</kbd> select</span>
              <span><kbd className="bg-surface-3 px-1 rounded">esc</kbd> close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
