import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Lightbulb, Radio, Hammer, BookMarked,
  ChevronLeft, ChevronRight, Search, Bell, Sun, Moon,
  LogOut, Crown, ArrowUp, ArrowDown
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import clsx from 'clsx';

const NAV = [
  { to: '/app',           label: 'Mission Control', icon: LayoutDashboard, end: true },
  { to: '/app/ideas',     label: 'Opportunities',   icon: Lightbulb },
  { to: '/app/signals',   label: 'Live Signals',    icon: Radio },
  { to: '/app/builder',   label: 'Startup Studio',  icon: Hammer },
  { to: '/app/watchlist', label: 'Watchlist',       icon: BookMarked },
];

const TIER_COLOR = {
  free: 'text-muted', pro: 'text-cyan', founder: 'text-gold', enterprise: 'text-violet', admin: 'text-gold',
};

// Bloomberg-style live ticker of sectors moving across the world right now
const TICKER = [
  ['Healthcare', 'up'], ['Supply Chain', 'down'], ['Robotics', 'up'], ['Energy', 'up'],
  ['FinTech', 'up'], ['Climate', 'up'], ['Defense', 'up'], ['Logistics', 'down'],
  ['AI Infra', 'up'], ['Biotech', 'up'], ['Space', 'up'], ['Payments', 'down'],
];

function Ticker() {
  const row = [...TICKER, ...TICKER];
  return (
    <div className="relative overflow-hidden max-w-[42vw] hidden md:block">
      <div className="ticker-track gap-6">
        {row.map(([name, dir], i) => (
          <span key={`${name}-${i}`} className="inline-flex items-center gap-1.5 text-[11px] font-mono text-secondary">
            <span className="text-muted">{name}</span>
            {dir === 'up'
              ? <span className="inline-flex items-center text-success"><ArrowUp size={10} /></span>
              : <span className="inline-flex items-center text-danger"><ArrowDown size={10} /></span>}
          </span>
        ))}
      </div>
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[var(--bg-sidebar)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[var(--bg-sidebar)] to-transparent" />
    </div>
  );
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 232 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="flex-shrink-0 flex flex-col bg-sidebar border-r border-default relative z-10"
      >
        {/* Logo — glowing node */}
        <div className="flex items-center h-16 px-4 border-b border-default">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 flex items-center justify-center flex-shrink-0">
              <span className="node node-pulse w-3.5 h-3.5" />
              <span className="absolute inset-0 rounded-full border border-[var(--border-glow)]" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                  className="leading-none"
                >
                  <div className="font-display font-bold gradient-text text-lg tracking-tight">NSE</div>
                  <div className="text-[9px] font-mono text-muted tracking-[0.18em] uppercase mt-0.5">Mission Control</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                clsx(
                  'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 select-none',
                  isActive
                    ? 'text-primary bg-[var(--brand-bg)] border border-[var(--brand-border)]'
                    : 'text-secondary hover:text-primary hover:bg-subtle border border-transparent'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-[var(--cyan)] shadow-glow-cyan" />}
                  <Icon size={17} className={clsx('flex-shrink-0', isActive && 'text-cyan')} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-default p-3 space-y-2">
          {user?.tier === 'free' && !collapsed && (
            <button
              onClick={() => navigate('/pricing')}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border border-[var(--gold-bg)] text-gold hover:shadow-glow-gold transition-all"
              style={{ background: 'var(--gold-bg)' }}
            >
              <Crown size={13} /> Unlock Founder Intelligence
            </button>
          )}

          <button
            onClick={toggle}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-secondary hover:text-primary hover:bg-subtle text-xs font-medium transition-colors"
            title={isDark ? 'Switch to Light' : 'Switch to Dark'}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
            <AnimatePresence>
              {!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{isDark ? 'Light Mode' : 'Dark Mode'}</motion.span>}
            </AnimatePresence>
          </button>

          <div className="flex items-center gap-2.5 px-1 pt-1">
            <div className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border border-[var(--border-strong)]',
              TIER_COLOR[user?.tier] || TIER_COLOR.free
            )} style={{ background: 'var(--bg-hover)' }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-primary truncate">{user?.name}</div>
                  <div className={clsx('text-[10px] font-mono capitalize', TIER_COLOR[user?.tier])}>
                    {user?.tier === 'founder' ? <span className="gold-shimmer">founder</span> : user?.tier}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {!collapsed && (
              <button onClick={logout} className="p-1.5 rounded-lg text-muted hover:text-danger transition-colors" title="Logout">
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Collapse */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-default flex items-center justify-center text-muted hover:text-cyan hover:border-[var(--border-glow)] shadow-sm transition-colors z-20"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </motion.aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 border-b border-default glass flex-shrink-0 z-10">
          <div className="flex items-center gap-5 min-w-0">
            <div className="flex items-center gap-2 text-xs text-secondary flex-shrink-0">
              <span className="node w-2 h-2" />
              <span className="font-medium">World Innovation Pulse</span>
              <span className="chip chip-live">LIVE</span>
            </div>
            <Ticker />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-subtle border border-default text-secondary text-xs hover:border-[var(--border-glow)] hover:text-cyan transition-all"
              onClick={() => document.dispatchEvent(new CustomEvent('openCommandBar'))}
            >
              <Search size={13} />
              <span>Ask Copilot or search…</span>
              <kbd className="text-[10px] font-mono bg-card px-1.5 py-0.5 rounded border border-default">⌘K</kbd>
            </button>
            <button className="p-2.5 rounded-xl text-secondary hover:text-primary hover:bg-subtle transition-colors relative">
              <Bell size={15} />
              <span className="absolute top-2 right-2 node w-1.5 h-1.5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-grid">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
