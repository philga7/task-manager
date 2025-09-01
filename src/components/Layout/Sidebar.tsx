import React from 'react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { TaskForm } from '../Tasks/TaskForm';
import { useApp } from '../../context/useApp';
import { 
  Home, 
  CheckSquare, 
  Folder, 
  Target, 
  BarChart3, 
  Settings,
  Plus,
  Lock,
  Play,
  GitBranch
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home, requiresAuth: true },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, requiresAuth: true },
  { name: 'Projects', href: '/projects', icon: Folder, requiresAuth: true },
  { name: 'Goals', href: '/goals', icon: Target, requiresAuth: true },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, requiresAuth: true },
  { name: 'GitHub', href: '/github', icon: GitBranch, requiresAuth: true },
  { name: 'Settings', href: '/settings', icon: Settings, requiresAuth: true },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const { state } = useApp();
  const { isAuthenticated, isDemoMode } = state.authentication;

  // Filter navigation items based on authentication status
  const filteredNavigation = navigation.filter(item => {
    if (item.requiresAuth) {
      return isAuthenticated || isDemoMode;
    }
    return true; // Settings is always available
  });

  return (
    <>
      {/* Mobile menu overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <div className={`flex flex-col w-64 bg-stone-900 border-r border-stone-800 fixed lg:relative h-full z-50 lg:z-auto transform lg:transform-none transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
      <div className="flex items-center h-16 px-6 border-b border-stone-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#D97757' }}>
            <CheckSquare className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Authentication Status Indicator */}
      {!isAuthenticated && !isDemoMode && (
        <div className="px-4 py-3 border-b border-stone-800">
          <div className="flex items-center space-x-2 px-3 py-2 bg-stone-800/50 border border-stone-700 rounded-lg">
            <Lock className="h-4 w-4 text-stone-400" />
            <span className="text-sm text-stone-400">Please login to access features</span>
          </div>
        </div>
      )}

      {isDemoMode && (
        <div className="px-4 py-3 border-b border-stone-800">
          <div className="flex items-center space-x-2 px-3 py-2 bg-amber-500/20 border border-amber-500/30 rounded-lg">
            <Play className="h-4 w-4 text-amber-400" />
            <span className="text-sm text-amber-300 font-medium">Demo Mode</span>
          </div>
        </div>
      )}

      <nav className="flex-1 px-4 py-6 space-y-2">
        {filteredNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-250 ${
                isActive
                  ? 'shadow-sm' 
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`
            }
            style={({ isActive }) => isActive ? { backgroundColor: '#2A1F1A', color: '#D97757' } : {}}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Quick Add Task Button - Only show for authenticated or demo users */}
      {(isAuthenticated || isDemoMode) && (
        <div className="px-4 pb-6">
          <button 
            onClick={() => setShowQuickAdd(true)}
            className="w-full flex items-center justify-center px-4 py-3 text-white rounded-xl font-medium transition-colors duration-250 shadow-sm hover:shadow-md"
            style={{ backgroundColor: '#D97757' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#C86A4A'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D97757'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Quick Add Task
          </button>
        </div>
      )}

      {showQuickAdd && (
        <TaskForm onClose={() => setShowQuickAdd(false)} />
      )}
    </div>
    </>
  );
}