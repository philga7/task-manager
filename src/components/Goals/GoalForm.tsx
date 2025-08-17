import React, { useState, useEffect } from 'react';
import { Goal, Milestone } from '../../types';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';
import { ValidationErrors } from '../UI/ValidationErrors';
import { 
  validateGoalData,
  ValidationResult
} from '../../utils/validation';
import { X, Target, Calendar, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/useApp';
import { MilestoneTaskLinker } from './MilestoneTaskLinker';
import { logger } from '../../utils/logger';

interface GoalFormProps {
  onClose: () => void;
  goal?: Goal;
}

export function GoalForm({ onClose, goal }: GoalFormProps) {
  const { state, dispatch } = useApp();
  const [formData, setFormData] = useState({
    title: goal?.title || '',
    description: goal?.description || '',
    targetDate: goal?.targetDate ? goal.targetDate.toISOString().split('T')[0] : '',
    progress: goal?.progress || 0
  });
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: true, errors: [], warnings: [] });
  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [milestones, setMilestones] = useState<Omit<Milestone, 'id'>[]>(
    goal?.milestones.map(m => ({ 
      title: m.title, 
      completed: m.completed, 
      completedAt: m.completedAt,
      taskIds: m.taskIds || [],
      projectId: m.projectId
    })) || 
    [{ title: '', completed: false, taskIds: [] }]
  );

  // Get all available tasks for linking
  const availableTasks = state.tasks;

  // Validate form data when it changes
  useEffect(() => {
    const goalData: Goal = {
      id: goal?.id || `goal-${Date.now()}`,
      title: formData.title,
      description: formData.description,
      targetDate: new Date(formData.targetDate || new Date()),
      progress: formData.progress,
      milestones: milestones
        .filter(m => m.title.trim())
        .map((m, index) => ({
          id: `milestone-${Date.now()}-${index}`,
          title: m.title,
          completed: m.completed,
          completedAt: m.completedAt,
          taskIds: m.taskIds || [],
          projectId: m.projectId
        })),
      createdAt: goal?.createdAt || new Date()
    };

    const validation = validateGoalData(goalData, state.tasks, state.projects);
    setValidationResult(validation);
    setShowValidation(validation.errors.length > 0 || validation.warnings.length > 0);
  }, [formData, milestones, state.tasks, state.projects, goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validationResult.isValid) {
      setShowValidation(true);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const goalData: Goal = {
        id: goal?.id || `goal-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        targetDate: new Date(formData.targetDate),
        progress: formData.progress,
        milestones: milestones
          .filter(m => m.title.trim())
          .map((m, index) => ({
            id: `milestone-${Date.now()}-${index}`,
            title: m.title,
            completed: m.completed,
            completedAt: m.completedAt,
            taskIds: m.taskIds || [],
            projectId: m.projectId
          })),
        createdAt: goal?.createdAt || new Date()
      };

      if (goal) {
        dispatch({ type: 'UPDATE_GOAL', payload: goalData });
      } else {
        dispatch({ type: 'ADD_GOAL', payload: goalData });
      }
      
      onClose();
    } catch (error) {
      logger.error('Error saving goal:', error);
      setValidationResult({
        isValid: false,
        errors: [{ field: 'submit', message: 'Failed to save goal. Please try again.', severity: 'error' }],
        warnings: []
      });
      setShowValidation(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMilestone = () => {
    setMilestones([...milestones, { title: '', completed: false, taskIds: [], completionType: undefined }]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: keyof Omit<Milestone, 'id'>, value: string | number | boolean | Date | string[]) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const handleMilestoneUpdate = (index: number, updatedMilestone: Milestone) => {
    const updated = [...milestones];
    updated[index] = {
      title: updatedMilestone.title,
      completed: updatedMilestone.completed,
      completedAt: updatedMilestone.completedAt,
      taskIds: updatedMilestone.taskIds || [],
      projectId: updatedMilestone.projectId,
      completionType: updatedMilestone.completionType
    };
    setMilestones(updated);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg md:text-xl font-semibold text-stone-100">
            {goal ? 'Edit Goal' : 'New Goal'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-stone-500 hover:text-stone-300 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Validation Errors and Warnings */}
          {showValidation && (
            <ValidationErrors
              errors={validationResult.errors}
              warnings={validationResult.warnings}
              onDismiss={() => setShowValidation(false)}
            />
          )}
          <div>
            <label className="block text-xs md:text-sm font-medium text-stone-300 mb-2">
              <Target className="w-4 h-4 inline mr-1" />
              Goal Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm md:text-base placeholder-stone-500"
              style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
              placeholder="Enter goal title..."
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
                <Calendar className="w-4 h-4 inline mr-1" />
                Target Date *
              </label>
              <input
                type="date"
                required
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="w-full px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm md:text-base"
                style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-stone-300 mb-2">
                Progress (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm md:text-base"
                style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs md:text-sm font-medium text-stone-300">
                Milestones
              </label>
              <Button type="button" variant="ghost" size="sm" onClick={addMilestone}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            
            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div key={index} className="p-4 border border-stone-700 rounded-lg bg-stone-800/50">
                  <div className="flex items-center space-x-1 md:space-x-2 mb-3">
                    <input
                      type="text"
                      value={milestone.title}
                      onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                      className="flex-1 px-2 md:px-3 py-1.5 md:py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm md:text-base placeholder-stone-500"
                      style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
                      placeholder="Milestone title..."
                    />
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(index)}
                        className="p-2 text-stone-500 hover:text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Task Linking Section */}
                  {milestone.title.trim() && (
                    <MilestoneTaskLinker
                      milestone={{
                        id: `temp-${index}`,
                        title: milestone.title,
                        completed: milestone.completed,
                        completedAt: milestone.completedAt,
                        taskIds: milestone.taskIds || [],
                        projectId: milestone.projectId
                      }}
                      availableTasks={availableTasks}
                      onUpdate={(updatedMilestone) => handleMilestoneUpdate(index, updatedMilestone)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <Button type="submit" className="flex-1" disabled={isSubmitting || !validationResult.isValid}>
              {isSubmitting ? 'Saving...' : (goal ? 'Update Goal' : 'Create Goal')}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}