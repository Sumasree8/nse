import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../store/authStore';

function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-surface-0 bg-grid flex items-center justify-center px-4">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 opacity-15 rounded-full"
        style={{ background: 'radial-gradient(ellipse, #00ff88, transparent)', filter: 'blur(40px)' }} />
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-neon-green flex items-center justify-center">
            <Zap size={16} fill="#080b12" stroke="none" />
          </div>
          <span className="font-display font-bold text-white text-lg">NSE</span>
        </div>
        <div className="card p-8" style={{ boxShadow: '0 0 40px rgba(0,255,136,0.05)' }}>
          <h1 className="font-display font-bold text-xl text-white mb-1">{title}</h1>
          <p className="text-sm text-gray-500 mb-6">{subtitle}</p>
          {children}
        </div>
      </motion.div>
    </div>
  );
}

export function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await login(form.email, form.password);
    if (ok) navigate('/app');
  };

  const fillDemo = () => setForm({ email: 'demo@nse.ai', password: 'demo1234' });

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your NSE account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-mono text-gray-500 mb-1.5 block">Email</label>
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="you@example.com" className="input-field" required />
        </div>
        <div>
          <label className="text-xs font-mono text-gray-500 mb-1.5 block">Password</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••" className="input-field pr-10" required />
            <button type="button" onClick={() => setShowPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
              {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center py-2.5">
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
        <button type="button" onClick={fillDemo} className="btn-ghost w-full justify-center text-xs py-2">
          Use Demo Account
        </button>
      </form>
      <p className="text-center text-xs text-gray-600 mt-5">
        Don't have an account?{' '}
        <Link to="/auth/register" className="text-neon-green hover:underline">Create one free</Link>
      </p>
    </AuthLayout>
  );
}

export function Register() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await register(form.name, form.email, form.password);
    if (ok) navigate('/app');
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start detecting startup opportunities today">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-mono text-gray-500 mb-1.5 block">Full Name</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Your name" className="input-field" required />
        </div>
        <div>
          <label className="text-xs font-mono text-gray-500 mb-1.5 block">Email</label>
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="you@example.com" className="input-field" required />
        </div>
        <div>
          <label className="text-xs font-mono text-gray-500 mb-1.5 block">Password</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Min 8 characters" className="input-field pr-10" required minLength={8} />
            <button type="button" onClick={() => setShowPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
              {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center py-2.5">
          {isLoading ? 'Creating account...' : 'Create Free Account'}
        </button>
      </form>
      <p className="text-center text-xs text-gray-500 mt-4">
        By signing up you agree to our Terms of Service
      </p>
      <p className="text-center text-xs text-gray-600 mt-2">
        Already have an account?{' '}
        <Link to="/auth/login" className="text-neon-green hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}

export default Login;
