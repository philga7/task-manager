import React, { useState } from 'react';
import { Task } from '../../types';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';
import { X, Calendar, Flag, Tag, Folder } from 'lucide-react';
import { useApp } from '../../context/useApp';

interface TaskFormProps {
  onClose: () => void;
  task?: Task;
}

// Helper function to safely format due date for form input
const formatDueDate = (dueDate: Date | string | undefined): string => {
  if (!dueDate) return '';
  
  // If it's already a Date object
  if (dueDate instanceof Date) {
    return dueDate.toISOString().split('T')[0];
  }
  
  // If it's a string, try to convert to Date
  if (typeof dueDate === 'string') {
    const dateObj = new Date(dueDate);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().split('T')[0];
    }
  }
  
  return '';
};

export function TaskForm({ onClose, task }: TaskFormProps) {
  const { state, dispatch } = useApp();
  

  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium' as 'low' | 'medium' | 'high',
    dueDate: formatDueDate(task?.dueDate),
    projectId: task?.projectId || '',
    tags: task?.tags.join(', ') || ''
  });


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    

    const taskData: Task = {
      id: task?.id || `task-${Date.now()}`,
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      status: task?.status || 'todo',
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      projectId: formData.projectId || undefined,
      createdAt: task?.createdAt || new Date(),
      completedAt: task?.completedAt,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
    };

    if (task) {
      dispatch({ type: 'UPDATE_TASK', payload: taskData });
    } else {
      dispatch({ type: 'ADD_TASK', payload: taskData });
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg md:text-xl font-semibold text-stone-100">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-stone-500 hover:text-stone-300 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-stone-300 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm md:text-base placeholder-stone-500"
              style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
              placeholder="Enter task title..."
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-stone-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-sm md:text-base placeholder-stone-500"
              style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
              rows={3}
              placeholder="Add description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-stone-300 mb-2">
                <Flag className="w-4 h-4 inline mr-1" />
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                className="w-full px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm md:text-base"
                style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-stone-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm md:text-base"
                style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-stone-300 mb-2">
              <Folder className="w-4 h-4 inline mr-1" />
              Project
            </label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="w-full px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm md:text-base"
              style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
            >
              <option value="">No Project</option>
              {state.projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-stone-300 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Tags
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm md:text-base placeholder-stone-500"
              style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
              placeholder="Enter tags separated by commas..."
            />
          </div>


          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <Button type="submit" className="flex-1">
              {task ? 'Update Task' : 'Create Task'}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}