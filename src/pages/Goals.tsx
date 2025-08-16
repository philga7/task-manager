import React from 'react';
import { useState } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { ProgressBar } from '../components/UI/ProgressBar';
import { GoalForm } from '../components/Goals/GoalForm';
import { ValidationErrors, ValidationInfo } from '../components/UI/ValidationErrors';
import { EmptyState } from '../components/UI/EmptyState';
import { DemoModeIndicator } from '../components/UI/DemoModeIndicator';
import { useApp } from '../context/useApp';
import { Plus, Target, CheckCircle2, Circle, FolderOpen, ChevronDown, ChevronRight, Link, Clock, Flag, Filter, X, Zap, Hand, Lock, LogIn } from 'lucide-react';
import { format } from 'date-fns';
import { getProjectProgressSummary, calculateMilestoneProgress } from '../utils/progress';
import { validateMilestoneTaskConsistency } from '../utils/validation';
import { Milestone, ValidationError } from '../types';

export function Goals() {
  const { state, dispatch } = useApp();
  const { isAuthenticated, isDemoMode } = state.authentication;
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<ValidationError[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>('');

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
              Please log in or try demo mode to access your goals and track your achievements.
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

  const toggleMilestoneExpansion = (milestoneId: string) => {
    const newExpanded = new Set(expandedMilestones);
    if (newExpanded.has(milestoneId)) {
      newExpanded.delete(milestoneId);
    } else {
      newExpanded.add(milestoneId);
    }
    setExpandedMilestones(newExpanded);
  };

  // Validation function for milestone state
  const isValidMilestoneState = (milestone: Milestone, goalId: string): boolean => {
    // Check if milestone exists
    if (!milestone || !milestone.id) {
      return false;
    }
    
    // Check if goal exists
    const goal = state.goals.find(g => g.id === goalId);
    if (!goal) {
      return false;
    }
    
    // Check if milestone belongs to the goal
    const milestoneExists = goal.milestones.some(m => m.id === milestone.id);
    if (!milestoneExists) {
      return false;
    }
    
    // Check if milestone is not already in a conflicting state
    if (milestone.taskIds && milestone.taskIds.length > 0) {
      // Task-linked milestones should not be manually completed
      return false;
    }
    
    return true;
  };

  // Show error message
  const showError = (message: string) => {
    setValidationErrors([{ field: 'milestone', message, severity: 'error' }]);
    setValidationWarnings([]);
    setSuccessMessage('');
    
    // Auto-clear error after 5 seconds
    setTimeout(() => {
      setValidationErrors([]);
    }, 5000);
  };

  // Show success message
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setValidationErrors([]);
    setValidationWarnings([]);
    
    // Auto-clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  // Show warning message
  const showWarning = (message: string) => {
    setValidationWarnings([{ field: 'milestone', message, severity: 'warning' }]);
    
    // Auto-clear warning after 4 seconds
    setTimeout(() => {
      setValidationWarnings([]);
    }, 4000);
  };

  const toggleMilestoneCompletion = (milestone: Milestone, goalId: string) => {
    try {
      // Clear any existing messages
      setValidationErrors([]);
      setValidationWarnings([]);
      setSuccessMessage('');

      // Validate milestone state
      if (!isValidMilestoneState(milestone, goalId)) {
        showError('Invalid milestone state. Please refresh the page and try again.');
        return;
      }

      // Validate milestone-task consistency
      const consistencyErrors = validateMilestoneTaskConsistency(milestone, state.tasks);
      if (consistencyErrors.length > 0) {
        showWarning(`Milestone has ${consistencyErrors.length} task consistency issue(s).`);
      }

      // Toggle completion status
      const updatedMilestone: Milestone = {
        ...milestone,
        completed: !milestone.completed,
        completedAt: !milestone.completed ? new Date() : undefined,
        completionType: 'manual'
      };

      // Update milestone in state
      dispatch({
        type: 'UPDATE_MILESTONE',
        payload: {
          goalId,
          milestoneId: milestone.id,
          updates: updatedMilestone
        }
      });

      // Show success message
      const action = updatedMilestone.completed ? 'completed' : 'uncompleted';
      showSuccess(`Milestone "${milestone.title}" ${action} successfully!`);

    } catch (error) {
      console.error('Error toggling milestone completion:', error);
      showError('Failed to update milestone. Please try again.');
    }
  };

  // Get completion status icon
  const getCompletionIcon = (completed: boolean) => {
    if (completed) {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
    return <Circle className="w-4 h-4 text-stone-400" />;
  };

  // Get priority color class
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-amber-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-stone-500';
    }
  };

  const clearProjectFilter = () => {
    setSelectedProjectFilter('');
  };

  // Get all unique projects across all goals for the filter dropdown
  const allProjects = state.projects.filter(project => 
    state.goals.some(goal => goal.id === project.goalId)
  );



  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Demo Mode Banner */}
      <DemoModeIndicator variant="banner" />

      {/* Validation Messages */}
      <ValidationErrors errors={validationErrors} />
      <ValidationInfo warnings={validationWarnings} />
      {successMessage && (
        <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-300">{successMessage}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-xl md:text-2xl font-semibold text-stone-100">Goals</h1>
            <DemoModeIndicator variant="badge" />
          </div>
          <p className="text-stone-400">{state.goals.length} active goals</p>
        </div>
        <Button onClick={() => setShowGoalForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Project Filter */}
      {state.projects.length > 0 && (
        <Card>
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-stone-400" />
              <span className="text-sm text-stone-400">Filter by project:</span>
              <DemoModeIndicator variant="tooltip" />
            </div>
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="px-3 py-1 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
            >
              <option value="">All Projects</option>
              {allProjects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {selectedProjectFilter && (
              <button
                onClick={clearProjectFilter}
                className="p-1 text-stone-400 hover:text-stone-300 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </Card>
      )}

      {state.goals.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-stone-300">Goal List</h3>
            <DemoModeIndicator variant="badge" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {state.goals
              .filter(goal => {
                if (!selectedProjectFilter) return true;
                return goal.projects.some(project => project.id === selectedProjectFilter);
              })
              .map(goal => {
                const goalProjects = state.projects.filter(project => project.goalId === goal.id);
                const filteredProjects = selectedProjectFilter 
                  ? goalProjects.filter(project => project.id === selectedProjectFilter)
                  : goalProjects;

                return (
                  <Card key={goal.id} hover>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Target className="w-5 h-5 text-amber-600" />
                          <div>
                            <h3 className="font-semibold text-stone-100 text-sm md:text-base">{goal.title}</h3>
                            <p className="text-xs text-stone-500">{format(goal.targetDate, 'MMM d, yyyy')}</p>
                          </div>
                        </div>
                        <DemoModeIndicator variant="tooltip" />
                      </div>

                      {goal.description && (
                        <p className="text-xs md:text-sm text-stone-400">{goal.description}</p>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-stone-500">
                          <span>Progress</span>
                          <span>{goal.progress}%</span>
                        </div>
                        <ProgressBar 
                          progress={goal.progress} 
                          color="amber"
                          className="h-2"
                        />
                      </div>

                      {/* Projects */}
                      {filteredProjects.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-xs text-stone-500">
                            <FolderOpen className="w-3 h-3" />
                            <span>Projects ({filteredProjects.length})</span>
                          </div>
                          <div className="space-y-1">
                            {filteredProjects.map(project => {
                              const projectTasks = state.tasks.filter(task => task.projectId === project.id);
                              const progressSummary = getProjectProgressSummary({ ...project, tasks: projectTasks });
                              
                              return (
                                <div key={project.id} className="flex items-center justify-between p-2 bg-stone-800/50 rounded-lg">
                                  <div className="flex items-center space-x-2">
                                    <div 
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: project.color }}
                                    />
                                    <span className="text-xs text-stone-300">{project.name}</span>
                                  </div>
                                  <span className="text-xs text-stone-500">{progressSummary.percentage}%</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Milestones */}
                      {goal.milestones.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-xs text-stone-500">
                            <Flag className="w-3 h-3" />
                            <span>Milestones ({goal.milestones.length})</span>
                          </div>
                          <div className="space-y-1">
                            {goal.milestones.map(milestone => {
                              const milestoneProgress = calculateMilestoneProgress(milestone, state.tasks);
                              const isExpanded = expandedMilestones.has(milestone.id);
                              
                              return (
                                <div key={milestone.id} className="border border-stone-700 rounded-lg">
                                  <div className="flex items-center justify-between p-2">
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => toggleMilestoneExpansion(milestone.id)}
                                        className="text-stone-400 hover:text-stone-300"
                                      >
                                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                      </button>
                                      {getCompletionIcon(milestone.completed)}
                                      <span className="text-xs text-stone-300">{milestone.title}</span>
                                      {milestone.taskIds && milestone.taskIds.length > 0 && (
                                        <Link className="w-3 h-3 text-blue-500" />
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-stone-500">{milestoneProgress.percentage}%</span>
                                      {!milestone.taskIds || milestone.taskIds.length === 0 ? (
                                        <button
                                          onClick={() => toggleMilestoneCompletion(milestone, goal.id)}
                                          className="p-1 text-stone-400 hover:text-stone-300 rounded"
                                        >
                                          <Hand className="w-3 h-3" />
                                        </button>
                                      ) : (
                                        <Zap className="w-3 h-3 text-amber-500" />
                                      )}
                                    </div>
                                  </div>
                                  
                                  {isExpanded && (
                                    <div className="p-2 border-t border-stone-700 bg-stone-800/30">
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs text-stone-500">
                                          <span>Progress</span>
                                          <span>{milestoneProgress.completed} of {milestoneProgress.total} tasks</span>
                                        </div>
                                        <ProgressBar 
                                          progress={milestoneProgress.percentage} 
                                          color="blue"
                                          className="h-1"
                                        />
                                        
                                        {milestone.taskIds && milestone.taskIds.length > 0 && (
                                          <div className="space-y-1">
                                            <div className="text-xs text-stone-500">Linked Tasks:</div>
                                            {milestone.taskIds.map(taskId => {
                                              const task = state.tasks.find(t => t.id === taskId);
                                              if (!task) return null;
                                              
                                              return (
                                                <div key={taskId} className="flex items-center justify-between p-1 bg-stone-700/20 rounded text-xs">
                                                  <span className={`text-stone-300 ${task.status === 'completed' ? 'line-through' : ''}`}>
                                                    {task.title}
                                                  </span>
                                                  <div className="flex items-center space-x-1">
                                                    <span className={getPriorityColor(task.priority)}>
                                                      {task.priority}
                                                    </span>
                                                    {task.dueDate && (
                                                      <div className="flex items-center space-x-1 text-stone-500">
                                                        <Clock className="w-2 h-2" />
                                                        <span>{format(task.dueDate, 'MMM d')}</span>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
      ) : (
        <EmptyState 
          type="goals" 
          onCreate={() => setShowGoalForm(true)}
        />
      )}

      {showGoalForm && (
        <GoalForm onClose={() => setShowGoalForm(false)} />
      )}
    </div>
  );
}