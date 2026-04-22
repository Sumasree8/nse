import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { BookMarked, Plus, Trash2, ArrowUpRight, Bell } from 'lucide-react';
import { watchlistAPI } from '../utils/api';
import ScoreRing from '../components/common/ScoreRing';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

export default function Watchlist() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => watchlistAPI.list().then(r => r.data),
    enabled: isAuthenticated(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => watchlistAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['watchlist']);
      setNewName('');
      setShowCreate(false);
      toast.success('Watchlist created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => watchlistAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['watchlist']);
      toast.success('Watchlist deleted');
    },
  });

  const lists = data?.watchlists || [];

  if (!isAuthenticated()) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-96">
        <BookMarked size={40} className="text-gray-700 mb-4" />
        <h2 className="text-lg font-semibold text-gray-300 mb-2">Sign in to use Watchlists</h2>
        <p className="text-sm text-gray-600 mb-6">Track opportunities and get alerts when new signals emerge</p>
        <button onClick={() => navigate('/auth/login')} className="btn-primary">Sign In</button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Watchlist</h1>
          <p className="text-sm text-gray-500 mt-1">Track ideas and get alerted on new signals</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-xs">
          <Plus size={13} /> New Watchlist
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="card p-5"
          >
            <h3 className="text-sm font-semibold text-gray-200 mb-3">Create Watchlist</h3>
            <div className="flex gap-3">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. HealthTech Opportunities"
                className="input-field flex-1"
                onKeyDown={e => e.key === 'Enter' && newName && createMutation.mutate({ name: newName })}
              />
              <button
                onClick={() => newName && createMutation.mutate({ name: newName })}
                disabled={!newName || createMutation.isPending}
                className="btn-primary text-xs"
              >
                Create
              </button>
              <button onClick={() => setShowCreate(false)} className="btn-ghost text-xs">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lists */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-28" />
          ))}
        </div>
      ) : lists.length === 0 ? (
        <div className="card p-16 text-center border-dashed border-surface-4">
          <BookMarked size={32} className="text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-600">No watchlists yet</p>
          <p className="text-xs text-gray-700 mt-1">Create a watchlist to track opportunities and get alerts</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-xs mt-4">
            <Plus size={12} /> Create First Watchlist
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {lists.map((list, i) => (
            <motion.div
              key={list._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">{list.name}</h3>
                  {list.description && <p className="text-xs text-gray-500 mt-0.5">{list.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {list.alerts?.enabled && (
                    <div className="flex items-center gap-1 text-[10px] font-mono text-neon-green">
                      <Bell size={10} className="animate-pulse" /> alerts on
                    </div>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(list._id)}
                    className="p-1.5 rounded text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Ideas in watchlist */}
              {list.ideas?.length > 0 ? (
                <div className="space-y-2">
                  {list.ideas.map(idea => (
                    <button
                      key={idea._id}
                      onClick={() => navigate(`/app/ideas/${idea._id}`)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-3 transition-colors text-left"
                    >
                      <ScoreRing score={idea.scoring?.opportunityScore || 0} size={36} strokeWidth={2.5} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-200 truncate">{idea.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {idea.scoring?.trendPhase && (
                            <span className={`phase-badge ${idea.scoring.trendPhase.toLowerCase()}`} style={{ fontSize: 9 }}>
                              {idea.scoring.trendPhase}
                            </span>
                          )}
                          <span className="text-[9px] text-gray-600">{idea.category?.industry}</span>
                        </div>
                      </div>
                      <ArrowUpRight size={12} className="text-gray-600" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-gray-600 border border-dashed border-surface-4 rounded-lg">
                  No ideas saved. Browse <button onClick={() => navigate('/app/ideas')} className="text-neon-green hover:underline">Opportunities</button> and save ideas here.
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
