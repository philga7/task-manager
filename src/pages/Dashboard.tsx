import React from 'react';
import { Card } from '../components/UI/Card';
import { ProgressBar } from '../components/UI/ProgressBar';
import { TaskCard } from '../components/Tasks/TaskCard';
import { DemoModeIndicator } from '../components/UI/DemoModeIndicator';
import { EmptyState } from '../components/UI/EmptyState';
import { useApp } from '../context/useApp';
import { CheckCircle2, Clock, Target, TrendingUp, FolderOpen, Users, Lock, LogIn } from 'lucide-react';
import { calculateOverallProgress } from '../utils/progress';

export function Dashboard() {
  const { state } = useApp();
  const { isAuthenticated, isDemoMode } = state.authentication;
  
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
              Please log in or try demo mode to access your dashboard and view your productivity overview.
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

  // Show empty state if no data and in demo mode
  if (isDemoMode && totalTasks === 0 && totalProjects === 0 && totalGoals === 0) {
    return (
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <DemoModeIndicator variant="banner" />
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-xl md:text-2xl font-semibold text-stone-100">Dashboard</h1>
            <DemoModeIndicator variant="badge" />
          </div>
          <p className="text-stone-400">Your productivity overview</p>
        </div>
        <EmptyState 
          type="dashboard" 
          onCreate={() => {
            // Navigate to tasks page to create first task
            window.location.hash = '#/tasks';
          }}
        />
      </div>
    );
  }

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <h3 className="text-base md:text-lg font-medium text-stone-100">Overall Goal Progress</h3>
          <ProgressBar 
            progress={overallGoalProgress.percentage} 
            color="amber"
            className="mt-4"
          />
          <div className="mt-4 text-xs md:text-sm text-stone-400">
            {overallGoalProgress.completed} of {overallGoalProgress.total} goals completed
          </div>
        </Card>

        <Card>
          <h3 className="text-base md:text-lg font-medium text-stone-100">Task Completion</h3>
          <ProgressBar 
            progress={completionRate} 
            color="green"
            className="mt-4"
          />
          <div className="mt-4 text-xs md:text-sm text-stone-400">
            {completedTasks} of {totalTasks} tasks completed
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <h3 className="text-base md:text-lg font-medium text-stone-100">Project Progress</h3>
          <ProgressBar 
            progress={totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0} 
            color="purple"
            className="mt-4"
          />
          <div className="mt-4 text-xs md:text-sm text-stone-400">
            {completedProjects} of {totalProjects} projects completed
          </div>
        </Card>

        <Card>
          <h3 className="text-base md:text-lg font-medium text-stone-100">Goal Progress Overview</h3>
          <div className="mt-4 space-y-3">
            {state.goals.slice(0, 3).map(goal => (
              <div key={goal.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Target className="w-4 h-4 text-amber-600" />
                  <span className="text-sm md:text-base font-medium text-stone-100">{goal.title}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs md:text-sm text-stone-400">{goal.progress}%</span>
                  <div className="w-16 h-2 bg-stone-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-600 rounded-full transition-all duration-300"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Tasks */}
      {recentTasks.length > 0 && (
        <Card>
          <h3 className="text-base md:text-lg font-medium text-stone-100">Recent Tasks</h3>
          <div className="mt-4 space-y-3">
            {recentTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}