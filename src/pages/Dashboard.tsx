import React from 'react';
import { Card } from '../components/UI/Card';
import { ProgressBar } from '../components/UI/ProgressBar';
import { TaskCard } from '../components/Tasks/TaskCard';
import { DemoModeIndicator } from '../components/UI/DemoModeIndicator';
import { useApp } from '../context/useApp';
import { CheckCircle2, Clock, Target, TrendingUp, FolderOpen, Users } from 'lucide-react';
import { calculateOverallProgress } from '../utils/progress';

export function Dashboard() {
  const { state } = useApp();
  
  const completedTasks = state.tasks.filter(task => task.status === 'completed').length;
  const totalTasks = state.tasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const todayTasks = state.tasks.filter(task => 
    task.dueDate && 
    new Date(task.dueDate).toDateString() === new Date().toDateString()
  );

  const overdueTasks = state.tasks.filter(task => 
    task.dueDate && 
    new Date(task.dueDate) < new Date() && 
    task.status !== 'completed'
  );

  const recentTasks = state.tasks.slice(0, 5);

  // Hierarchical calculations
  const overallGoalProgress = calculateOverallProgress(state.goals);
  const totalGoals = state.goals.length;
  const completedGoals = state.goals.filter(goal => goal.progress === 100).length;
  const totalProjects = state.projects.length;
  const completedProjects = state.projects.filter(project => project.progress === 100).length;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Demo Mode Banner */}
      <DemoModeIndicator variant="banner" />

      <div>
        <div className="flex items-center space-x-3 mb-2">
          <h1 className="text-xl md:text-2xl font-semibold text-stone-100">Dashboard</h1>
          <DemoModeIndicator variant="badge" />
        </div>
        <p className="text-stone-400">Your productivity overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-6">
        <Card>
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="p-1.5 md:p-2 bg-green-100 rounded-xl">
              <CheckCircle2 className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-stone-400">Tasks</p>
              <p className="text-lg md:text-2xl font-semibold text-stone-100">{completedTasks}/{totalTasks}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="p-1.5 md:p-2 bg-purple-100 rounded-xl">
              <FolderOpen className="w-4 h-4 md:w-6 md:h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-stone-400">Projects</p>
              <p className="text-lg md:text-2xl font-semibold text-stone-100">{completedProjects}/{totalProjects}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="p-1.5 md:p-2 bg-amber-100 rounded-xl">
              <Target className="w-4 h-4 md:w-6 md:h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-stone-400">Goals</p>
              <p className="text-lg md:text-2xl font-semibold text-stone-100">{completedGoals}/{totalGoals}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="p-1.5 md:p-2 bg-blue-100 rounded-xl">
              <Clock className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-stone-400">Due Today</p>
              <p className="text-lg md:text-2xl font-semibold text-stone-100">{todayTasks.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="p-1.5 md:p-2 bg-red-100 rounded-xl">
              <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-red-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-stone-400">Overdue</p>
              <p className="text-lg md:text-2xl font-semibold text-stone-100">{overdueTasks.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="p-1.5 md:p-2 bg-indigo-100 rounded-xl">
              <Users className="w-4 h-4 md:w-6 md:h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-stone-400">Productivity</p>
              <p className="text-lg md:text-2xl font-semibold text-stone-100">{state.analytics.productivity}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base md:text-lg font-medium text-stone-100">Overall Goal Progress</h3>
            <DemoModeIndicator variant="tooltip" />
          </div>
          <ProgressBar value={overallGoalProgress.percentage} showLabel color="green" />
          <div className="mt-4 text-xs md:text-sm text-stone-400">
            {completedGoals} of {totalGoals} goals completed
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base md:text-lg font-medium text-stone-100">Task Completion</h3>
            <DemoModeIndicator variant="tooltip" />
          </div>
          <ProgressBar value={completionRate} showLabel color="blue" />
          <div className="mt-4 text-xs md:text-sm text-stone-400">
            {completedTasks} of {totalTasks} tasks completed
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base md:text-lg font-medium text-stone-100">Project Progress</h3>
            <DemoModeIndicator variant="tooltip" />
          </div>
          <ProgressBar value={totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0} showLabel color="amber" />
          <div className="mt-4 text-xs md:text-sm text-stone-400">
            {completedProjects} of {totalProjects} projects completed
          </div>
        </Card>
      </div>

      {/* Goal Overview */}
      {state.goals.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base md:text-lg font-medium text-stone-100">Goal Progress Overview</h3>
            <DemoModeIndicator variant="badge" />
          </div>
          <div className="space-y-4">
            {state.goals.map(goal => {
              const goalProjects = state.projects.filter(project => project.goalId === goal.id);
              const completedGoalProjects = goalProjects.filter(project => project.progress === 100).length;
              
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-amber-600" />
                      <span className="text-sm md:text-base font-medium text-stone-100">{goal.title}</span>
                    </div>
                    <span className="text-xs md:text-sm text-stone-400">{goal.progress}%</span>
                  </div>
                  <ProgressBar value={goal.progress} color="green" />
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>{goalProjects.length} projects</span>
                    <span>{completedGoalProjects} completed</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Recent Tasks with Context */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-medium text-stone-100">Recent Tasks</h3>
          <DemoModeIndicator variant="badge" />
        </div>
        <div className="space-y-3">
          {recentTasks.map(task => {
            const associatedProject = state.projects.find(project => project.id === task.projectId);
            const associatedGoal = associatedProject ? state.goals.find(goal => goal.id === associatedProject.goalId) : null;
            
            return (
              <div key={task.id} className="space-y-2">
                <TaskCard task={task} />
                {(associatedProject || associatedGoal) && (
                  <div className="ml-4 text-xs text-stone-500">
                    {associatedProject && (
                      <span className="flex items-center space-x-1">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: associatedProject.color }}
                        />
                        <span>{associatedProject.name}</span>
                      </span>
                    )}
                    {associatedGoal && (
                      <span className="flex items-center space-x-1 ml-2">
                        <Target className="w-2 h-2" />
                        <span>{associatedGoal.title}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}