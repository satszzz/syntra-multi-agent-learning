import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Target, 
  CalendarDays, 
  BookOpen, 
  Sparkles, 
  HelpCircle, 
  BarChart3, 
  Cpu, 
  LogOut, 
  Layers,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navigationItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Learning Goals', path: '/goals', icon: Target },
  { name: 'Study Plan', path: '/study-plan', icon: CalendarDays },
  { name: 'Study Materials (RAG)', path: '/documents', icon: BookOpen },
  { name: 'AI Study Assistant', path: '/tutor', icon: Sparkles },
  { name: 'Quizzes & Evaluation', path: '/quiz', icon: HelpCircle },
  { name: 'Learning Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Agent Activity', path: '/agent-activity', icon: Cpu },
];

export const Sidebar = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-dark-800/95 border-r border-white/5 flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <NavLink to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary via-brand-secondary to-brand-accent p-0.5 shadow-lg shadow-brand-primary/20 group-hover:shadow-brand-primary/40 transition-all">
            <div className="w-full h-full bg-dark-900 rounded-[10px] flex items-center justify-center">
              <Layers className="w-5 h-5 text-brand-primary group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-brand-primary">
                SYNTRA
              </span>
              <span className="text-[10px] font-semibold bg-brand-primary/20 text-brand-primary px-1.5 py-0.5 rounded border border-brand-primary/30">
                v1.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight">Multi-Agent Learning AI</p>
          </div>
        </NavLink>
      </div>

      {/* Agents Mesh Live Status */}
      <div className="px-4 py-3 mx-4 my-3 rounded-lg bg-dark-900/80 border border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className="text-xs font-medium text-slate-300">5 AI Agents Mesh</span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
          AUTONOMOUS
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group
                ${isActive 
                  ? 'bg-gradient-to-r from-brand-primary/20 to-brand-secondary/10 text-white border border-brand-primary/30 shadow-lg shadow-brand-primary/10' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'}
              `}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>{item.name}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="p-4 border-t border-white/5 bg-dark-900/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center font-bold text-sm text-white flex-shrink-0">
              {user?.name ? user.name[0].toUpperCase() : 'S'}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.name || 'Satheeswaran'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || 'student@syntra.ai'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
