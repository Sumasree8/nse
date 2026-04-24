import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Lightbulb, Radio, Hammer, BookMarked,
  ChevronLeft, ChevronRight, Search, Bell, Sun, Moon,
  Zap, LogOut, Crown
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import clsx from 'clsx';

const NAV = [
  { to: '/app',           label: 'Dashboard',    icon: LayoutDashboard, end: true },
  { to: '/app/ideas',     label: 'Opportunities', icon: Lightbulb },
  { to: '/app/signals',   label: 'Live Signals',  icon: Radio },
  { to: '/app/builder',   label: 'Builder',       icon: Hammer },
  { to: '/app/watchlist', label: 'Watchlist',     icon: BookMarked },
];

const TIER_COLOR = {
  free:       'text-slate-400',
  pro:        'text-info',
  founder:    'text-brand',
  enterprise: 'text-violet-400',
  admin:      'text-accent-500',
};
const TIER_BG = {
  free:       'bg-slate-100 dark:bg-slate-800',
  pro:        'bg-sky-50 dark:bg-sky-900/30',
  founder:    'bg-brand-50 dark:bg-brand-900/30',
  enterprise: 'bg-violet-50 dark:bg-violet-900/30',
  admin:      'bg-amber-50 dark:bg-amber-900/30',
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  return (
    <div className="flex h-screen bg-page overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 60 : 220 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="flex-shrink-0 flex flex-col bg-sidebar border-r border-default relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-4 border-b border-default">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0 shadow-brand-sm">
              <Zap size={14} className="text-white" fill="white" stroke="none" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="font-display font-bold text-primary text-base tracking-tight"
                >
                  NSE
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 select-none',
                  isActive
                    ? 'bg-brand text-brand-500 dark:text-brand-400'
                    : 'text-secondary hover:text-primary hover:bg-subtle'
                )
              }
            >
              <Icon size={16} className="flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        {/* Bottom panel */}
        <div className="border-t border-default p-3 space-y-2">
          {/* Upgrade nudge */}
          {user?.tier === 'free' && !collapsed && (
            <button
              onClick={() => navigate('/pricing')}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-brand text-brand-500 dark:text-brand-400 text-xs font-semibold hover:bg-brand-100 dark:hover:bg-brand-900/40 border border-brand-border transition-colors"
            >
              <Crown size={12} />
              Upgrade to Pro
            </button>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-secondary hover:text-primary hover:bg-subtle text-xs font-medium transition-colors"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark
              ? <Sun size={14} className="flex-shrink-0" />
              : <Moon size={14} className="flex-shrink-0" />
            }
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* User row */}
          <div className="flex items-center gap-2 px-1 pt-1">
            <div
              className={clsx(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                TIER_BG[user?.tier] || TIER_BG.free,
                TIER_COLOR[user?.tier] || TIER_COLOR.free
              )}
            >
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-primary truncate">{user?.name}</div>
                  <div className={clsx('text-[10px] font-mono capitalize', TIER_COLOR[user?.tier])}>
                    {user?.tier}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {!collapsed && (
              <button
                onClick={logout}
                className="p-1 rounded text-muted hover:text-danger transition-colors"
                title="Logout"
              >
                <LogOut size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-card border border-default flex items-center justify-center text-muted hover:text-primary shadow-sm transition-colors z-20"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </motion.aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-default bg-sidebar/80 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span>Intelligence Feed</span>
            <span className="font-mono text-success text-[10px]">LIVE</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-subtle border border-default text-secondary text-xs hover:border-brand-border hover:text-brand transition-all"
              onClick={() => document.dispatchEvent(new CustomEvent('openCommandBar'))}
            >
              <Search size={12} />
              <span>Search</span>
              <kbd className="text-[10px] font-mono bg-card px-1.5 py-0.5 rounded border border-default">⌘K</kbd>
            </button>
            <button className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-subtle transition-colors relative">
              <Bell size={14} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-500" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-grid">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
