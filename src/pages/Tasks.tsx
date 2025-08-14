import React, { useState } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { TaskCard } from '../components/Tasks/TaskCard';
import { TaskForm } from '../components/Tasks/TaskForm';
import { useApp } from '../context/useApp';
import { Plus, Filter, SortDesc } from 'lucide-react';

export function Tasks() {
  const { state, dispatch } = useApp();
  const [showCompleted, setShowCompleted] = useState(false);
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'created'>('dueDate');
  const [showTaskForm, setShowTaskForm] = useState(false);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-stone-100 mb-2">Tasks</h1>
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

          <div className="w-full sm:w-auto">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded border-stone-600 bg-stone-800 text-amber-600 focus:ring-amber-500"
              style={{ accentColor: '#D97757' }}
            />
            <span className="text-xs sm:text-sm text-stone-300">Show completed</span>
          </label>
          </div>
          </div>
        </div>
      </Card>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {sortedTasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      {sortedTasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-stone-400">No tasks found matching your criteria.</p>
        </div>
      )}

      {showTaskForm && (
        <TaskForm onClose={() => setShowTaskForm(false)} />
      )}
    </div>
  );
}