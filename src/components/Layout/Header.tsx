import React from 'react';
import { Search, Bell, User, Menu } from 'lucide-react';
import { useApp } from '../../context/useApp';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { state, dispatch } = useApp();

  return (
    <header className="h-16 bg-stone-900 border-b border-stone-800 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <button 
          className="lg:hidden p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors duration-250"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <div className="flex items-center flex-1 max-w-lg">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-500" />
          <input
            type="text"
            placeholder="Search tasks, projects, or goals..."
            value={state.searchQuery}
            onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-stone-800 border border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-250 text-sm md:text-base text-stone-200 placeholder-stone-500"
            style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
          />
        </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors duration-250">
          <Bell className="h-5 w-5" />
        </button>
        <button className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors duration-250">
          <User className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}