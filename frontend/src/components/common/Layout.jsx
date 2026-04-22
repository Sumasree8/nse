import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Lightbulb, Radio, Hammer, BookMarked,
  ChevronLeft, ChevronRight, Search, Bell, Settings,
  Zap, LogOut, Crown
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import clsx from 'clsx';

const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/ideas', label: 'Opportunities', icon: Lightbulb },
  { to: '/app/signals', label: 'Live Signals', icon: Radio },
  { to: '/app/builder', label: 'Builder', icon: Hammer },
  { to: '/app/watchlist', label: 'Watchlist', icon: BookMarked },
];

const TIER_COLORS = { free: '#8b9ab0', pro: '#00d4ff', founder: '#00ff88', enterprise: '#bf00ff', admin: '#ff6b00' };
const TIER_LABELS = { free: 'Free', pro: 'Pro', founder: 'Founder', enterprise: 'Enterprise', admin: 'Admin' };

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-surface-0 overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 220 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="flex-shrink-0 flex flex-col bg-surface-1 border-r border-surface-3 relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-4 border-b border-surface-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-neon-green flex items-center justify-center flex-shrink-0">
              <Zap size={14} fill="#080b12" stroke="none" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-display font-700 text-white text-base tracking-tight"
                >
                  NSE
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-neon-green/10 text-neon-green'
                    : 'text-gray-500 hover:text-gray-200 hover:bg-surface-3'
                )
              }
              title={collapsed ? label : undefined}
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

        {/* Bottom: User + tier */}
        <div className="border-t border-surface-3 p-3 space-y-2">
          {/* Upgrade nudge for free users */}
          {user?.tier === 'free' && !collapsed && (
            <button
              onClick={() => navigate('/pricing')}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-neon-green/10 border border-neon-green/20 text-neon-green text-xs font-medium hover:bg-neon-green/20 transition-colors"
            >
              <Crown size={12} />
              Upgrade to Pro
            </button>
          )}

          <div className="flex items-center gap-2 px-1">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: TIER_COLORS[user?.tier] + '22', color: TIER_COLORS[user?.tier] }}
            >
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-gray-200 truncate">{user?.name}</div>
                  <div className="text-[10px] font-mono" style={{ color: TIER_COLORS[user?.tier] }}>
                    {TIER_LABELS[user?.tier]}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {!collapsed && (
              <button onClick={logout} className="p-1 rounded text-gray-600 hover:text-gray-300 transition-colors" title="Logout">
                <LogOut size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-surface-3 border border-surface-4 flex items-center justify-center text-gray-500 hover:text-gray-200 transition-colors z-20"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-surface-3 bg-surface-1/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="font-mono text-neon-green">▸</span>
            <span>Global Intelligence Feed</span>
            <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
            <span className="text-neon-green">LIVE</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-3 border border-surface-4 text-gray-500 text-xs hover:border-gray-500 transition-colors"
              onClick={() => document.dispatchEvent(new CustomEvent('openCommandBar'))}
            >
              <Search size={12} />
              <span>Search</span>
              <kbd className="text-[10px] font-mono bg-surface-4 px-1.5 py-0.5 rounded border border-surface-4">⌘K</kbd>
            </button>
            <button className="p-2 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-surface-3 transition-colors relative">
              <Bell size={14} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-neon-green" />
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
