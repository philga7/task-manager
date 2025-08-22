import React, { useState } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { TaskCard } from '../components/Tasks/TaskCard';
import { TaskForm } from '../components/Tasks/TaskForm';
import { EmptyState } from '../components/UI/EmptyState';
import { DemoModeIndicator } from '../components/UI/DemoModeIndicator';
import { useApp } from '../context/useApp';
import { Plus, Filter, SortDesc, Lock, LogIn } from 'lucide-react';
import { detectSilentFailures } from '../utils/issueReporting';

export function Tasks() {
  const { state, dispatch } = useApp();
  const { isAuthenticated, isDemoMode } = state.authentication;
  const [showCompleted, setShowCompleted] = useState(false);
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'created'>('dueDate');
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Show authentication prompt for unauthenticated users
  if (!isAuthenticated && !isDemoMode) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
          <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-stone-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-stone-100">Authentication Required</h1>
            <p className="text-stone-400 max-w-md">
              Please log in or try demo mode to access your tasks and manage your productivity.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.location.href = '/settings'}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Go to Login</span>
            </button>
            <button
              onClick={() => {
                // This will be handled by the demo mode button in the header
                const demoButton = document.querySelector('[data-demo-button]') as HTMLButtonElement;
                if (demoButton) demoButton.click();
              }}
              className="px-6 py-3 border border-stone-600 hover:border-stone-500 text-stone-300 hover:text-stone-200 rounded-lg font-medium transition-colors"
            >
              Try Demo Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Silent failure detection
  const silentFailures = detectSilentFailures({
    tasks: state.tasks,
    projects: state.projects,
    goals: state.goals,
    authentication: state.authentication,
    searchQuery: state.searchQuery,
    selectedProject: state.selectedProject,
    selectedPriority: state.selectedPriority,
    userSettings: state.userSettings
  }, 'tasks');
  
  if (silentFailures.length > 0) {
    console.log('Silent failures detected:', silentFailures);
  }

  const filteredTasks = state.tasks.filter(task => {
    let matches = true;

    if (state.searchQuery) {
      matches = matches && (
        task.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        task.tags.some(tag => tag.toLowerCase().includes(state.searchQuery.toLowerCase()))
      );
    }

    if (state.selectedProject) {
      matches = matches && task.projectId === state.selectedProject;
    }

    if (state.selectedPriority) {
      matches = matches && task.priority === state.selectedPriority;
    }

    if (!showCompleted) {
      matches = matches && task.status !== 'completed';
    }

    return matches;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Check if tasks are newly created (within 24 hours)
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const aIsNew = new Date(a.createdAt) > twentyFourHoursAgo;
    const bIsNew = new Date(b.createdAt) > twentyFourHoursAgo;
    
    // Prioritize newly created tasks at the top
    if (aIsNew && !bIsNew) return -1;
    if (!aIsNew && bIsNew) return 1;
    
    // If both are new or both are old, apply normal sorting
    switch (sortBy) {
      case 'dueDate':
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case 'priority': {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return 0;
    }
  });

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Demo Mode Banner */}
      <DemoModeIndicator variant="banner" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-xl md:text-2xl font-semibold text-stone-100">Tasks</h1>
            <DemoModeIndicator variant="badge" />
          </div>
          <p className="text-stone-400">{filteredTasks.length} tasks found</p>
        </div>
        <Button onClick={() => setShowTaskForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-stone-500" />
            <span className="text-xs sm:text-sm font-medium text-stone-300">Filters:</span>
            <DemoModeIndicator variant="tooltip" />
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <select
            value={state.selectedProject || ''}
            onChange={(e) => dispatch({ 
              type: 'SET_SELECTED_PROJECT', 
              payload: e.target.value || null 
            })}
            className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 flex-1 sm:flex-none min-w-0"
            style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
          >
            <option value="">All Projects</option>
            {state.projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>

          <select
            value={state.selectedPriority || ''}
            onChange={(e) => dispatch({ 
              type: 'SET_SELECTED_PRIORITY', 
              payload: e.target.value || null 
            })}
            className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 flex-1 sm:flex-none min-w-0"
            style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <div className="flex items-center space-x-2">
            <SortDesc className="w-4 h-4 text-stone-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'priority' | 'created')}
              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 flex-1 sm:flex-none min-w-0"
              style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="created">Created</option>
            </select>
          </div>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded border-stone-600 bg-stone-800 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-xs sm:text-sm text-stone-300">Show completed</span>
          </label>
        </div>
        </div>
      </Card>

      {/* Task List */}
      <div>
        <h3 className="text-sm font-medium text-stone-300">Task List</h3>
        <div className="mt-4 space-y-3">
          {sortedTasks.length > 0 ? (
            sortedTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))
          ) : (
            <EmptyState 
              type="tasks" 
              onCreate={() => setShowTaskForm(true)}
            />
          )}
        </div>
      </div>

      {showTaskForm && (
        <TaskForm onClose={() => setShowTaskForm(false)} />
      )}
    </div>
  );
}