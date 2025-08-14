import React, { useState } from 'react';
import { Project } from '../../types';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';
import { X, Palette, Target } from 'lucide-react';
import { useApp } from '../../context/useApp';

interface ProjectFormProps {
  onClose: () => void;
  project?: Project;
}

const projectColors = [
  '#D97757', '#B8956A', '#8B7355', '#6B8E23', '#4682B4', 
  '#9370DB', '#CD853F', '#708090', '#2F4F4F', '#8FBC8F'
];

export function ProjectForm({ onClose, project }: ProjectFormProps) {
  const { state, dispatch } = useApp();
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    color: project?.color || projectColors[0],
    goalId: project?.goalId || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that a goal is selected when goals exist
    if (state.goals.length > 0 && !formData.goalId) {
      alert('Please select a goal for this project.');
      return;
    }
    
    const projectData: Project = {
      id: project?.id || `proj-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      color: formData.color,
      goalId: formData.goalId,
      createdAt: project?.createdAt || new Date(),
      tasks: project?.tasks || [],
      progress: project?.progress || 0
    };

    if (project) {
      dispatch({ type: 'UPDATE_PROJECT', payload: projectData });
    } else {
      dispatch({ type: 'ADD_PROJECT', payload: projectData });
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg md:text-xl font-semibold text-stone-100">
            {project ? 'Edit Project' : 'New Project'}
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
              Project Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm md:text-base placeholder-stone-500"
              style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
              placeholder="Enter project name..."
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

          <div>
            <label className="block text-xs md:text-sm font-medium text-stone-300 mb-2">
              <Target className="w-4 h-4 inline mr-1" />
              Goal *
            </label>
            {state.goals.length === 0 ? (
              <div className="p-3 border border-stone-700 bg-stone-800 rounded-lg">
                <p className="text-sm text-stone-400">
                  No goals available. Please create a goal first to assign this project.
                </p>
              </div>
            ) : (
              <select
                required
                value={formData.goalId}
                onChange={(e) => setFormData({ ...formData, goalId: e.target.value })}
                className="w-full px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm md:text-base"
                style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
              >
                <option value="">Select a goal...</option>
                {state.goals.map(goal => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-stone-300 mb-2">
              <Palette className="w-4 h-4 inline mr-1" />
              Color
            </label>
            <div className="grid grid-cols-5 gap-1.5 md:gap-2">
              {projectColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-lg border-2 transition-all ${
                    formData.color === color ? 'border-stone-400 scale-110' : 'border-stone-600 hover:border-stone-500'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={state.goals.length === 0}
            >
              {project ? 'Update Project' : 'Create Project'}
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