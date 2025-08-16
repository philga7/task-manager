import React from 'react';
import { useState } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { ProgressBar } from '../components/UI/ProgressBar';
import { ProjectForm } from '../components/Projects/ProjectForm';
import { EmptyState } from '../components/UI/EmptyState';
import { DemoModeIndicator } from '../components/UI/DemoModeIndicator';
import { useApp } from '../context/useApp';
import { Plus, Calendar, Users, Target, Filter, Lock, LogIn } from 'lucide-react';
import { format } from 'date-fns';
import { getProjectProgressSummary } from '../utils/progress';

export function Projects() {
  const { state } = useApp();
  const { isAuthenticated, isDemoMode } = state.authentication;
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [selectedGoalFilter, setSelectedGoalFilter] = useState<string>('all');

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
              Please log in or try demo mode to access your projects and track your progress.
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

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Demo Mode Banner */}
      <DemoModeIndicator variant="banner" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-xl md:text-2xl font-semibold text-stone-100">Projects</h1>
            <DemoModeIndicator variant="badge" />
          </div>
          <p className="text-stone-400">{state.projects.length} active projects</p>
        </div>
        <Button onClick={() => setShowProjectForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Goal Filter */}
      {state.goals.length > 0 && (
        <Card>
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-stone-400" />
              <span className="text-sm text-stone-400">Filter by goal:</span>
              <DemoModeIndicator variant="tooltip" />
            </div>
            <select
              value={selectedGoalFilter}
              onChange={(e) => setSelectedGoalFilter(e.target.value)}
              className="px-3 py-1 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
            >
              <option value="all">All Goals</option>
              {state.goals.map(goal => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </div>
        </Card>
      )}

      {state.projects.filter(project => selectedGoalFilter === 'all' || project.goalId === selectedGoalFilter).length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-stone-300">Project List</h3>
            <DemoModeIndicator variant="badge" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {state.projects
              .filter(project => selectedGoalFilter === 'all' || project.goalId === selectedGoalFilter)
              .map(project => {
                const projectTasks = state.tasks.filter(task => task.projectId === project.id);
                const progressSummary = getProjectProgressSummary({ ...project, tasks: projectTasks });
                const associatedGoal = state.goals.find(goal => goal.id === project.goalId);

                return (
                <Card key={project.id} hover>
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <div>
                          <h3 className="font-semibold text-stone-100 text-sm md:text-base">{project.name}</h3>
                          {associatedGoal && (
                            <div className="flex items-center space-x-1 mt-1">
                              <Target className="w-3 h-3 text-amber-600" />
                              <span className="text-xs text-stone-500">{associatedGoal.title}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <DemoModeIndicator variant="tooltip" />
                    </div>

                    {project.description && (
                      <p className="text-xs md:text-sm text-stone-400">{project.description}</p>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-stone-500">
                        <span>Progress</span>
                        <span>{progressSummary.percentage}%</span>
                      </div>
                      <ProgressBar 
                        progress={progressSummary.percentage} 
                        color="blue"
                        className="h-2"
                      />
                      <div className="flex items-center justify-between text-xs text-stone-500">
                        <span>{progressSummary.completed} of {progressSummary.total} tasks</span>
                        <span>{format(project.createdAt, 'MMM d')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-700">
                      <div className="flex items-center space-x-1 text-xs text-stone-500">
                        <Users className="w-3 h-3" />
                        <span>{projectTasks.length} tasks</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-stone-500">
                        <Calendar className="w-3 h-3" />
                        <span>{format(project.createdAt, 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              )})}
          </div>
        </div>
      ) : (
        <EmptyState 
          type="projects" 
          onCreate={() => setShowProjectForm(true)}
        />
      )}

      {showProjectForm && (
        <ProjectForm onClose={() => setShowProjectForm(false)} />
      )}
    </div>
  );
}