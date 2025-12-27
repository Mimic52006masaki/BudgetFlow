
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

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-1.5 bg-background-element rounded-full border border-border-subtle">
            <div className="w-2 h-2 rounded-full bg-accent-success animate-pulse"></div>
            <span className="text-xs font-mono text-neutral-muted">システムオンライン</span>
          </div>
          <div className="flex items-center gap-4 border-l border-border-subtle pl-6">
            <button className="relative text-neutral-muted hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-accent-danger rounded-full"></span>
            </button>
            <div 
              className="h-9 w-9 rounded-sm bg-neutral-muted/20 bg-cover bg-center border border-primary/30 ring-2 ring-transparent hover:ring-primary/50 transition-all cursor-pointer"
              style={{ backgroundImage: `url(https://picsum.photos/seed/user/100/100)` }}
              onClick={() => onViewChange(View.LOGIN)}
            ></div>
          </div>
        </div>
      </div>
    </header>
  );
};
