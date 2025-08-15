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
import { Plus, Target, Calendar, CheckCircle2, Circle, FolderOpen, Users, ChevronDown, ChevronRight, Link, Clock, Flag, Filter, X, Zap, Hand } from 'lucide-react';
import { format } from 'date-fns';
import { getProjectProgressSummary, calculateMilestoneProgress } from '../utils/progress';
import { validateMilestoneTaskConsistency } from '../utils/validation';
import { Milestone, ValidationError } from '../types';

export function Goals() {
  const { state, dispatch } = useApp();
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<ValidationError[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>('');

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
      
      // Prevent clicking on task-linked milestones
      if (milestone.taskIds && milestone.taskIds.length > 0) {
        showError('Task-linked milestones auto-complete when all associated tasks are finished.');
        return;
      }
      
      // Validate milestone-task consistency
      const consistencyValidation = validateMilestoneTaskConsistency(milestone, state.tasks);
      if (!consistencyValidation.isValid) {
        showError('Milestone validation failed. Please check associated tasks.');
        return;
      }
      
      if (consistencyValidation.warnings.length > 0) {
        showWarning(consistencyValidation.warnings[0].message);
      }
      
      const updates = {
        completed: !milestone.completed,
        completedAt: !milestone.completed ? new Date() : undefined
      };
      
      // Perform completion operation
      dispatch({ type: 'UPDATE_MILESTONE', payload: { goalId, milestoneId: milestone.id, updates } });
      
      // Show success message
      const action = milestone.completed ? 'uncompleted' : 'completed';
      showSuccess(`Milestone "${milestone.title}" ${action} successfully.`);
      
    } catch (error) {
      console.error('Milestone completion error:', error);
      showError('Failed to update milestone. Please try again.');
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <Circle className="w-4 h-4 text-stone-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-amber-500';
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

  // Get the selected project object for display
  const selectedProject = allProjects.find(project => project.id === selectedProjectFilter);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Demo Mode Banner */}
      <DemoModeIndicator variant="banner" />

      {/* Validation Messages */}
      <ValidationErrors 
        errors={validationErrors} 
        warnings={validationWarnings}
        onDismiss={() => {
          setValidationErrors([]);
          setValidationWarnings([]);
        }}
      />
      
      {successMessage && (
        <ValidationInfo 
          message={successMessage}
          type="success"
          onDismiss={() => setSuccessMessage('')}
        />
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
      <Card>
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-stone-500" />
            <span className="text-xs sm:text-sm font-medium text-stone-300">Milestone Filter:</span>
            <DemoModeIndicator variant="tooltip" />
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 flex-1 sm:flex-none min-w-0"
              style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
            >
              <option value="">All Projects</option>
              {allProjects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>

            {selectedProjectFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearProjectFilter}
                className="text-stone-400 hover:text-stone-300"
              >
                <X className="w-4 h-4" />
                Clear
              </Button>
            )}
          </div>

          {selectedProject && (
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-stone-400">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedProject.color }}
              />
              <span>Filtering milestones for: {selectedProject.name}</span>
            </div>
          )}
        </div>
      </Card>

      <div className="space-y-4 md:space-y-6">
        {state.goals.map(goal => {
          const completedMilestones = goal.milestones.filter(m => m.completed).length;
          const totalMilestones = goal.milestones.length;
          const milestoneProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

          // Get associated projects for this goal
          const goalProjects = state.projects.filter(project => project.goalId === goal.id);
          const totalProjects = goalProjects.length;
          const completedProjects = goalProjects.filter(project => project.progress === 100).length;

          // Calculate total tasks for this goal
          const totalTasks = goalProjects.reduce((sum, project) => {
            const projectTasks = state.tasks.filter(task => task.projectId === project.id);
            return sum + projectTasks.length;
          }, 0);

          const completedTasks = goalProjects.reduce((sum, project) => {
            const projectTasks = state.tasks.filter(task => task.projectId === project.id && task.status === 'completed');
            return sum + projectTasks.length;
          }, 0);

          // Filter milestones based on selected project
          const filteredMilestones = selectedProjectFilter 
            ? goal.milestones.filter(milestone => milestone.projectId === selectedProjectFilter)
            : goal.milestones;

          // Skip rendering this goal if no milestones match the filter
          if (selectedProjectFilter && filteredMilestones.length === 0) {
            return null;
          }

          return (
            <Card key={goal.id} padding="lg">
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <Target className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
                      <h3 className="text-lg md:text-xl font-semibold text-stone-100">{goal.title}</h3>
                      <DemoModeIndicator variant="badge" />
                    </div>
                    {goal.description && (
                      <p className="text-sm md:text-base text-stone-400">{goal.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs md:text-sm text-stone-500">
                    <Calendar className="w-4 h-4" />
                    <span>Due {format(goal.targetDate, 'MMM d, yyyy')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm md:text-base font-medium text-stone-100">Overall Progress</h4>
                      <DemoModeIndicator variant="tooltip" />
                    </div>
                    <ProgressBar value={goal.progress} showLabel color="green" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm md:text-base font-medium text-stone-100">Project Progress</h4>
                      <DemoModeIndicator variant="tooltip" />
                    </div>
                    <ProgressBar value={totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0} showLabel color="amber" />
                    <p className="text-xs md:text-sm text-stone-400">
                      {completedProjects} of {totalProjects} projects completed
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm md:text-base font-medium text-stone-100">Task Progress</h4>
                      <DemoModeIndicator variant="tooltip" />
                    </div>
                    <ProgressBar value={totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0} showLabel color="blue" />
                    <p className="text-xs md:text-sm text-stone-400">
                      {completedTasks} of {totalTasks} tasks completed
                    </p>
                  </div>
                </div>

                {goalProjects.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm md:text-base font-medium text-stone-100 flex items-center">
                        <FolderOpen className="w-4 h-4 mr-2" />
                        Associated Projects ({totalProjects})
                      </h4>
                      <DemoModeIndicator variant="badge" />
                    </div>
                    <div className="space-y-3">
                      {goalProjects.map(project => {
                        const projectTasks = state.tasks.filter(task => task.projectId === project.id);
                        const projectSummary = getProjectProgressSummary({ ...project, tasks: projectTasks });
                        
                        return (
                          <div key={project.id} className="ml-4 border-l-2 border-stone-700 pl-4 py-2">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: project.color }}
                                />
                                <h5 className="text-sm md:text-base font-medium text-stone-100">{project.name}</h5>
                              </div>
                              <div className="flex items-center space-x-2 text-xs text-stone-500">
                                <Users className="w-3 h-3" />
                                <span>{projectTasks.length} tasks</span>
                                <DemoModeIndicator variant="tooltip" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <ProgressBar value={projectSummary.percentage} color="amber" />
                              <p className="text-xs text-stone-400">
                                {projectSummary.completedTasks} of {projectSummary.totalTasks} tasks completed
                              </p>
                            </div>
                            {project.description && (
                              <p className="text-xs text-stone-500 mt-1">{project.description}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {filteredMilestones.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm md:text-base font-medium text-stone-100">
                        Milestones
                        {selectedProjectFilter && (
                          <span className="text-stone-400 ml-2">
                            (Filtered: {filteredMilestones.length} of {goal.milestones.length})
                          </span>
                        )}
                      </h4>
                      <DemoModeIndicator variant="badge" />
                    </div>
                    
                    {/* Milestone Completion Info */}
                    <div className="mb-4 p-3 bg-stone-800/50 border border-stone-700 rounded-lg">
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1 text-blue-400 bg-blue-900/20 px-2 py-1 rounded-full">
                            <Zap className="w-3 h-3" />
                            <span>Auto</span>
                          </div>
                          <span className="text-stone-400">= Task-linked, auto-completed</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1 text-purple-400 bg-purple-900/20 px-2 py-1 rounded-full">
                            <Hand className="w-3 h-3" />
                            <span>Manual</span>
                          </div>
                          <span className="text-stone-400">= Manually completed</span>
                        </div>
                      </div>
                      <p className="text-xs text-stone-400 mt-2">
                        Task-linked milestones automatically complete when all associated tasks are finished. Manual milestones can be completed independently.
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      {filteredMilestones.map(milestone => {
                        // Calculate milestone progress based on associated tasks
                        const milestoneProgress = calculateMilestoneProgress(milestone, state.tasks);
                        
                        // Get associated tasks for this milestone
                        const associatedTasks = milestone.taskIds 
                          ? state.tasks.filter(task => milestone.taskIds!.includes(task.id))
                          : [];
                        
                        const completedAssociatedTasks = associatedTasks.filter(task => task.status === 'completed').length;
                        const isExpanded = expandedMilestones.has(milestone.id);

                        return (
                          <div key={milestone.id} className="border border-stone-700 rounded-lg p-4 bg-stone-800/30 group">
                            <div className="space-y-3">
                              {/* Milestone Header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 flex-1">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleMilestoneCompletion(milestone, goal.id);
                                    }}
                                    className={`mt-0.5 transition-all duration-200 ${
                                      milestone.taskIds && milestone.taskIds.length > 0 
                                        ? 'cursor-not-allowed opacity-60 hover:opacity-60' 
                                        : 'cursor-pointer hover:text-amber-500 hover:scale-110'
                                    }`}
                                    disabled={milestone.taskIds && milestone.taskIds.length > 0}
                                    title={milestone.taskIds && milestone.taskIds.length > 0 
                                      ? 'Task-linked milestones auto-complete when all associated tasks are finished' 
                                      : 'Click to toggle completion status'
                                    }
                                    style={{ '--hover-color': '#D97757' }}
                                    onMouseEnter={(e) => {
                                      if (!milestone.taskIds || milestone.taskIds.length === 0) {
                                        e.currentTarget.style.color = '#D97757';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!milestone.taskIds || milestone.taskIds.length === 0) {
                                        e.currentTarget.style.color = '';
                                      }
                                    }}
                                  >
                                    {milestone.completed ? (
                                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-stone-400" />
                                    )}
                                  </button>
                                  <span className={`flex-1 text-sm md:text-base ${milestone.completed ? 'line-through text-stone-500' : 'text-stone-300'} ${
                                    !milestone.taskIds || milestone.taskIds.length === 0 
                                      ? 'hover:text-stone-200 transition-colors duration-200' 
                                      : ''
                                  }`}>
                                    {milestone.title}
                                    {!milestone.taskIds || milestone.taskIds.length === 0 && (
                                      <span className="ml-2 text-xs text-stone-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        (clickable)
                                      </span>
                                    )}
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                  {/* Completion Type Indicators */}
                                  <div className="flex items-center space-x-2">
                                    {/* Auto-completed indicator */}
                                    {milestone.completionType === 'auto' && (
                                      <div className="flex items-center space-x-1 text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded-full border border-blue-700/30">
                                        <Zap className="w-3 h-3" />
                                        <span>Auto</span>
                                      </div>
                                    )}
                                    
                                    {/* Manual completion indicator */}
                                    {milestone.completionType === 'manual' && (
                                      <div className="flex items-center space-x-1 text-xs text-purple-400 bg-purple-900/30 px-2 py-1 rounded-full border border-purple-700/30">
                                        <Hand className="w-3 h-3" />
                                        <span>Manual</span>
                                      </div>
                                    )}
                                    
                                    {/* Task-linked indicator */}
                                    {associatedTasks.length > 0 && (
                                      <div className="flex items-center space-x-1 text-xs text-stone-400 bg-stone-700/30 px-2 py-1 rounded-full border border-stone-600/30">
                                        <Link className="w-3 h-3" />
                                        <span>{completedAssociatedTasks}/{associatedTasks.length} tasks</span>
                                      </div>
                                    )}
                                    
                                    {/* Clickable indicator for manual milestones */}
                                    {(!milestone.taskIds || milestone.taskIds.length === 0) && !milestone.completed && (
                                      <div className="flex items-center space-x-1 text-xs text-amber-400 bg-amber-900/20 px-2 py-1 rounded-full border border-amber-700/20 animate-pulse">
                                        <span>Click to complete</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Completion Date */}
                                  {milestone.completedAt && (
                                    <span className="text-xs text-stone-500">
                                      {format(milestone.completedAt, 'MMM d')}
                                    </span>
                                  )}
                                  
                                  {/* Expand/Collapse Button */}
                                  {associatedTasks.length > 0 && (
                                    <button
                                      onClick={() => toggleMilestoneExpansion(milestone.id)}
                                      className="p-1 text-stone-400 hover:text-stone-300 rounded transition-colors"
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="w-4 h-4" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Milestone Progress Bar */}
                              <div className="space-y-2">
                                <ProgressBar value={milestoneProgress} color="blue" />
                                <p className="text-xs text-stone-400">
                                  {milestoneProgress}% complete
                                  {associatedTasks.length > 0 && (
                                    <span> • {completedAssociatedTasks} of {associatedTasks.length} associated tasks completed</span>
                                  )}
                                </p>
                              </div>

                              {/* Associated Tasks Section */}
                              {associatedTasks.length > 0 && isExpanded && (
                                <div className="mt-3 pt-3 border-t border-stone-700">
                                  <h5 className="text-sm font-medium text-stone-300 mb-2 flex items-center">
                                    <Link className="w-4 h-4 mr-2" />
                                    Associated Tasks ({associatedTasks.length})
                                  </h5>
                                  <div className="space-y-2">
                                    {associatedTasks.map(task => (
                                      <div key={task.id} className="flex items-center space-x-3 p-2 bg-stone-800/50 rounded border border-stone-700">
                                        {getTaskStatusIcon(task.status)}
                                        <div className="flex-1 min-w-0">
                                          <h6 className={`text-sm font-medium text-stone-200 truncate ${task.status === 'completed' ? 'line-through' : ''}`}>
                                            {task.title}
                                          </h6>
                                          {task.description && (
                                            <p className="text-xs text-stone-400 truncate">{task.description}</p>
                                          )}
                                        </div>
                                        <div className="flex items-center space-x-2 text-xs text-stone-500">
                                          <Flag className={`w-3 h-3 ${getPriorityColor(task.priority)}`} />
                                          <span className="capitalize">{task.priority}</span>
                                          {task.dueDate && (
                                            <>
                                              <Calendar className="w-3 h-3" />
                                              <span>{format(task.dueDate, 'MMM d')}</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="pt-2">
                      <ProgressBar value={milestoneProgress} showLabel color="blue" />
                      <p className="text-xs md:text-sm text-stone-400 mt-1">
                        {completedMilestones} of {totalMilestones} milestones completed
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {state.goals.length === 0 && (
        <EmptyState 
          type="goals" 
          onCreate={() => setShowGoalForm(true)}
        />
      )}

      {selectedProjectFilter && state.goals.every(goal => {
        const filteredMilestones = goal.milestones.filter(milestone => milestone.projectId === selectedProjectFilter);
        return filteredMilestones.length === 0;
      }) && (
        <div className="text-center py-12">
          <p className="text-stone-400">No milestones found for the selected project.</p>
        </div>
      )}

      {showGoalForm && (
        <GoalForm onClose={() => setShowGoalForm(false)} />
      )}
    </div>
  );
}