import React from 'react';
import { Card } from '../components/UI/Card';
import { ProgressBar } from '../components/UI/ProgressBar';
import { EmptyState } from '../components/UI/EmptyState';
import { DemoModeIndicator } from '../components/UI/DemoModeIndicator';
import { ParallelExecutionView } from '../components/ParallelExecution';
import { AgentStatusDashboard } from '../components/Dashboard';
import { useApp } from '../context/useApp';
import { TrendingUp, Clock, Target, Zap, Lock, LogIn } from 'lucide-react';
import { calculateRealTimeAnalytics, generateWeeklyProductivityData } from '../utils/progress';

export function Analytics() {
  const { state } = useApp();
  const { isAuthenticated, isDemoMode } = state.authentication;
  
  // Calculate real-time analytics from actual task data
  const realTimeAnalytics = calculateRealTimeAnalytics(state.tasks);
  const weeklyData = generateWeeklyProductivityData(state.tasks);

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
              Please log in or try demo mode to access your analytics and productivity insights.
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



  // Check if there's any data to show
  const hasData = state.tasks.length > 0 || state.projects.length > 0 || state.goals.length > 0;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Demo Mode Banner */}
      <DemoModeIndicator variant="banner" />

      <div>
        <div className="flex items-center space-x-3 mb-2">
          <h1 className="text-xl md:text-2xl font-semibold text-stone-100">Analytics</h1>
          <DemoModeIndicator variant="badge" />
        </div>
        <p className="text-stone-400">Your productivity insights and trends</p>
      </div>

      {!hasData && (
        <EmptyState 
          type="analytics" 
          onCreate={() => {
            // Navigate to tasks page to create first task
            window.location.hash = '#/tasks';
          }}
        />
      )}

      {hasData && (
        <>
          {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card>
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="p-2 md:p-3 bg-green-100 rounded-xl">
              <Target className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-stone-400">Tasks Completed</p>
              <p className="text-lg md:text-2xl font-semibold text-stone-100">{realTimeAnalytics.tasksCompleted}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="p-2 md:p-3 bg-blue-100 rounded-xl">
              <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-stone-400">Productivity Score</p>
              <p className="text-lg md:text-2xl font-semibold text-stone-100">{realTimeAnalytics.productivity}%</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="p-2 md:p-3 bg-amber-100 rounded-xl">
              <Zap className="w-4 h-4 md:w-6 md:h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-stone-400">Current Streak</p>
              <p className="text-lg md:text-2xl font-semibold text-stone-100">{realTimeAnalytics.streakDays} days</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="p-2 md:p-3 bg-purple-100 rounded-xl">
              <Clock className="w-4 h-4 md:w-6 md:h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-stone-400">Avg. Completion</p>
              <p className="text-lg md:text-2xl font-semibold text-stone-100">{realTimeAnalytics.averageCompletionTime}d</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base md:text-lg font-medium text-stone-100">Weekly Productivity</h3>
            <DemoModeIndicator variant="badge" />
          </div>
          <div className="space-y-3">
            {weeklyData.data.map((value, index) => (
              <div key={index} className="flex items-center space-x-3">
                <span className="w-8 text-xs text-stone-600">{weeklyData.days[index]}</span>
                <div className="flex-1 bg-stone-700 rounded-full h-2">
                  <div 
                    className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className="w-8 text-xs text-stone-400 text-right">{value}%</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base md:text-lg font-medium text-stone-100">Task Distribution</h3>
            <DemoModeIndicator variant="badge" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-stone-400">Completed</span>
              <span className="text-xs md:text-sm font-medium text-stone-100">{realTimeAnalytics.tasksCompleted}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-stone-400">In Progress</span>
              <span className="text-xs md:text-sm font-medium text-stone-100">
                {state.tasks.filter(task => task.status === 'in-progress').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-stone-400">To Do</span>
              <span className="text-xs md:text-sm font-medium text-stone-100">
                {state.tasks.filter(task => task.status === 'todo').length}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Goal Progress */}
      {state.goals.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base md:text-lg font-medium text-stone-100">Goal Progress</h3>
            <DemoModeIndicator variant="badge" />
          </div>
          <div className="space-y-3">
            {state.goals.slice(0, 5).map(goal => (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm md:text-base font-medium text-stone-100">{goal.title}</span>
                  <span className="text-xs md:text-sm text-stone-400">{goal.progress}%</span>
                </div>
                <ProgressBar 
                  progress={goal.progress} 
                  color="amber"
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Agent Status Dashboard */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-medium text-stone-100">Agent Status Dashboard</h3>
          <DemoModeIndicator variant="badge" />
        </div>
        <AgentStatusDashboard />
      </Card>

      {/* Parallel Execution Dashboard */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-medium text-stone-100">Parallel Execution Dashboard</h3>
          <DemoModeIndicator variant="badge" />
        </div>
        <ParallelExecutionView />
      </Card>
        </>
      )}
    </div>
  );
}