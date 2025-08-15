import React from 'react';
import { useState } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { ProgressBar } from '../components/UI/ProgressBar';
import { ProjectForm } from '../components/Projects/ProjectForm';
import { EmptyState } from '../components/UI/EmptyState';
import { DemoModeIndicator } from '../components/UI/DemoModeIndicator';
import { useApp } from '../context/useApp';
import { Plus, Calendar, Users, Target, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { getProjectProgressSummary } from '../utils/progress';

export function Projects() {
  const { state } = useApp();
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [selectedGoalFilter, setSelectedGoalFilter] = useState<string>('all');

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
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-stone-400">Progress</span>
                        <span className="text-stone-100 font-medium">{progressSummary.percentage}%</span>
                      </div>
                      <ProgressBar value={progressSummary.percentage} color="amber" />
                    </div>

                    <div className="flex items-center justify-between text-xs text-stone-500">
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{projectTasks.length} tasks</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{format(project.createdAt, 'MMM d')}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
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