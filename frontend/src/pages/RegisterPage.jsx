import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Layers, Mail, Lock, User, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [learningStyle, setLearningStyle] = useState('Visual & Interactive');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password, learningStyle);
      navigate('/goals');
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <NavLink to="/" className="inline-flex items-center gap-3 group mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-primary via-brand-secondary to-brand-accent p-0.5 shadow-xl shadow-brand-primary/30">
            <div className="w-full h-full bg-dark-900 rounded-[14px] flex items-center justify-center">
              <Layers className="w-6 h-6 text-brand-primary group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </NavLink>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Create your SYNTRA Account</h2>
        <p className="mt-2 text-sm text-slate-400">Initialize your autonomous learning workspace</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="glass-panel py-8 px-6 sm:px-10 rounded-3xl border border-white/10 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-sm text-rose-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Satheeswaran"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-brand-primary transition-colors"
                />
              </div>
            </div>

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
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-brand-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Learning Style</label>
              <select
                value={learningStyle}
                onChange={(e) => setLearningStyle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-brand-primary transition-colors"
              >
                <option value="Visual & Interactive">Visual & Interactive</option>
                <option value="Theory & Practical Drills">Theory & Practical Drills</option>
                <option value="Exam & Quiz Heavy">Exam & Quiz Heavy</option>
                <option value="Deep Conceptual Dive">Deep Conceptual Dive</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold text-sm shadow-lg shadow-brand-primary/25 transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Creating workspace...' : 'Start Personalized Learning'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <NavLink to="/login" className="font-semibold text-brand-primary hover:underline">
              Sign in
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
};
