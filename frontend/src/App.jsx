import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Layout from './components/common/Layout';
import CommandBar from './components/common/CommandBar';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Ideas = lazy(() => import('./pages/Ideas'));
const IdeaDetail = lazy(() => import('./pages/IdeaDetail'));
const Builder = lazy(() => import('./pages/Builder'));
const Signals = lazy(() => import('./pages/Signals'));
const Watchlist = lazy(() => import('./pages/Watchlist'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Landing = lazy(() => import('./pages/Landing'));

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated());
  return isAuthenticated ? children : <Navigate to="/auth/login" replace />;
}

function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-0">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-gray-500 tracking-widest">LOADING</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <CommandBar />
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />

          {/* App (protected) */}
          <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="ideas" element={<Ideas />} />
            <Route path="ideas/:id" element={<IdeaDetail />} />
            <Route path="builder" element={<Builder />} />
            <Route path="signals" element={<Signals />} />
            <Route path="watchlist" element={<Watchlist />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
