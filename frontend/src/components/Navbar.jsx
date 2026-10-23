import React from 'react';
import { NavLink } from 'react-router-dom';
import { Bell, Sparkles, Clock, BookMarked, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ activeGoal, onTriggerAdaptation, isAdapting }) => {
  const { user } = useAuth();
  const subject = activeGoal?.subject || 'Computer Networks';
  const daysRemaining = activeGoal?.days_remaining ?? 7;

  return (
    <header className="h-16 bg-dark-800/60 backdrop-blur-md border-b border-white/5 sticky top-0 z-20 px-8 flex items-center justify-between">
      {/* Active Goal Quick Pill */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-xs">
          <BookMarked className="w-3.5 h-3.5 text-brand-primary" />
          <span className="font-semibold text-slate-200">{subject}</span>
          <span className="text-slate-500">•</span>
          <span className="text-brand-accent font-mono font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" /> {daysRemaining} days until exam
          </span>
        </div>
      </div>

      {/* Action Buttons & Agent Status */}
      <div className="flex items-center gap-3">
        {onTriggerAdaptation && (
          <button
            onClick={onTriggerAdaptation}
            disabled={isAdapting}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
              ${isAdapting 
                ? 'bg-brand-primary/20 text-brand-primary border-brand-primary/40 animate-pulse cursor-not-allowed'
                : 'bg-dark-700 text-slate-200 border-white/10 hover:border-brand-primary/40 hover:bg-dark-600'}
            `}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAdapting ? 'animate-spin text-brand-primary' : 'text-slate-400'}`} />
            <span>{isAdapting ? 'Agents Rebalancing...' : 'Adapt Study Plan'}</span>
          </button>
        )}

        <NavLink
          to="/agent-activity"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-primary/10 via-brand-secondary/10 to-brand-accent/10 border border-brand-primary/30 text-xs font-medium text-slate-200 hover:border-brand-primary/50 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-primary animate-pulse" />
          <span>Supervisor Live</span>
        </NavLink>
      </div>
    </header>
  );
};
