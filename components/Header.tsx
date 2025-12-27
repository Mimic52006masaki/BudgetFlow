
import React from 'react';
import { View } from '../types';

interface HeaderProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
  return (
    <header className="bg-background-base/80 border-b border-border-subtle sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-[1920px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div 
            className="flex items-center gap-3 group cursor-pointer"
            onClick={() => onViewChange(View.DASHBOARD)}
          >
            <div className="size-9 bg-background-element border border-primary/30 rounded flex items-center justify-center text-primary group-hover:text-white group-hover:bg-primary transition-all duration-300">
              <span className="material-symbols-outlined">dataset</span>
            </div>
            <h1 className="text-lg font-bold tracking-widest uppercase text-neutral-light group-hover:text-primary transition-colors">
              BudgetFlow <span className="text-primary text-xs ml-1 align-top opacity-70">CMD</span>
            </h1>
          </div>
          
          <div className="h-8 w-px bg-border-subtle mx-2 hidden md:block"></div>
          
          <nav className="hidden md:flex items-center gap-1">
            <button 
              onClick={() => onViewChange(View.DASHBOARD)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${
                currentView === View.DASHBOARD ? 'text-primary bg-primary/10 border border-primary/20' : 'text-neutral-muted hover:text-neutral-light hover:bg-neutral-light/5'
              }`}
            >
              <span className="mr-2 opacity-30">[01]</span>ダッシュボード
            </button>
            <button 
              onClick={() => onViewChange(View.HISTORY)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${
                currentView === View.HISTORY ? 'text-primary bg-primary/10 border border-primary/20' : 'text-neutral-muted hover:text-neutral-light hover:bg-neutral-light/5'
              }`}
            >
              <span className="mr-2 opacity-30">[02]</span>履歴
            </button>
          </nav>
        </div>


      </div>
    </header>
  );
};
