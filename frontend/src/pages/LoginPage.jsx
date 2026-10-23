import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Layers, Mail, Lock, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (err) {
      setError("Demo login error: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <NavLink to="/" className="inline-flex items-center gap-3 group mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-primary via-brand-secondary to-brand-accent p-0.5 shadow-xl shadow-brand-primary/30">
            <div className="w-full h-full bg-dark-900 rounded-[14px] flex items-center justify-center">
              <Layers className="w-6 h-6 text-brand-primary group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </NavLink>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Welcome back to SYNTRA</h2>
        <p className="mt-2 text-sm text-slate-400">Sign in to coordinate your AI learning team</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="glass-panel py-8 px-6 sm:px-10 rounded-3xl border border-white/10 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-sm text-rose-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Instant 1-Click Demo Button */}
          <button
            onClick={handleDemo}
            disabled={loading}
            type="button"
            className="w-full mb-6 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-primary/20 via-brand-secondary/20 to-brand-accent/20 border border-brand-primary/40 hover:border-brand-primary text-slate-100 font-semibold text-sm flex items-center justify-center gap-2 transition-all group shadow-md"
          >
            <Sparkles className="w-4 h-4 text-brand-primary group-hover:rotate-12 transition-transform" />
            <span>1-Click Instant Demo Login</span>
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-dark-800 px-3 text-slate-400 font-mono">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@syntra.ai"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-brand-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-brand-primary transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold text-sm shadow-lg shadow-brand-primary/25 transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <NavLink to="/register" className="font-semibold text-brand-primary hover:underline">
              Create an account
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
};
