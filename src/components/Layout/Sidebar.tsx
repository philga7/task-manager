import React from 'react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { TaskForm } from '../Tasks/TaskForm';
import { 
  Home, 
  CheckSquare, 
  Folder, 
  Target, 
  BarChart3, 
  Settings,
  Plus
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Projects', href: '/projects', icon: Folder },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);

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

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => (
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

      {showQuickAdd && (
        <TaskForm onClose={() => setShowQuickAdd(false)} />
      )}
    </div>
    </>
  );
}