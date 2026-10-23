import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { goalService, studyPlanService } from '../services/api';

export const MainLayout = () => {
  const [activeGoal, setActiveGoal] = useState(null);
  const [isAdapting, setIsAdapting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const fetchGoal = async () => {
      try {
        const res = await goalService.getActiveGoal();
        setActiveGoal(res.data);
      } catch (err) {
        console.error("Failed to load active goal:", err);
      }
    };
    fetchGoal();
  }, []);

  const handleTriggerAdaptation = async () => {
    setIsAdapting(true);
    try {
      const res = await studyPlanService.triggerAdaptation();
      setToastMessage("Supervisor Agent & Planning Agent successfully rebalanced your study plan!");
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      console.error("Failed to adapt plan:", err);
    } finally {
      setIsAdapting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-dark-900 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar 
          activeGoal={activeGoal} 
          onTriggerAdaptation={handleTriggerAdaptation} 
          isAdapting={isAdapting}
        />
        
        {/* Toast Alert */}
        {toastMessage && (
          <div className="mx-8 mt-4 p-4 rounded-xl bg-gradient-to-r from-brand-primary/20 via-brand-secondary/20 to-brand-accent/20 border border-brand-primary/40 flex items-center justify-between text-sm shadow-xl animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-brand-accent animate-ping" />
              <span className="font-medium text-slate-100">{toastMessage}</span>
            </div>
            <button 
              onClick={() => setToastMessage(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5"
            >
              Dismiss
            </button>
          </div>
        )}

        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet context={{ activeGoal, setActiveGoal, isAdapting }} />
        </main>
      </div>
    </div>
  );
};
