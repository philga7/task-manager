import React from 'react';
import { useState } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { ProgressBar } from '../components/UI/ProgressBar';
import { ProjectForm } from '../components/Projects/ProjectForm';
import { useApp } from '../context/AppContext';
import { Plus, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';

export function Projects() {
  const { state } = useApp();
  const [showProjectForm, setShowProjectForm] = useState(false);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-stone-100 mb-2">Projects</h1>
          <p className="text-stone-400">{state.projects.length} active projects</p>
        </div>
        <Button onClick={() => setShowProjectForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {state.projects.map(project => {
          const projectTasks = state.tasks.filter(task => task.projectId === project.id);
          const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
          const actualProgress = projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0;

          return (
            <Card key={project.id} hover>
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <h3 className="font-semibold text-stone-100 text-sm md:text-base">{project.name}</h3>
                  </div>
                </div>

                {project.description && (
                  <p className="text-xs md:text-sm text-stone-400">{project.description}</p>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-stone-400">Progress</span>
                    <span className="text-stone-100 font-medium">{Math.round(actualProgress)}%</span>
                  </div>
                  <ProgressBar value={actualProgress} color="amber" />
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

      {state.projects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-stone-400">No projects yet. Create your first project to get started.</p>
        </div>
      )}

      {showProjectForm && (
        <ProjectForm onClose={() => setShowProjectForm(false)} />
      )}
    </div>
  );
}