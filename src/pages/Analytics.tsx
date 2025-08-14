import React from 'react';
import { Card } from '../components/UI/Card';
import { ProgressBar } from '../components/UI/ProgressBar';
import { useApp } from '../context/AppContext';
import { TrendingUp, Clock, Target, Zap } from 'lucide-react';

export function Analytics() {
  const { state } = useApp();
  const { analytics } = state;

  const weeklyData = [65, 75, 80, 85, 78, 82, 88];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-stone-100 mb-2">Analytics</h1>
        <p className="text-stone-400">Your productivity insights and trends</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card>
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="p-2 md:p-3 bg-green-100 rounded-xl">
              <Target className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-stone-400">Tasks Completed</p>
              <p className="text-lg md:text-2xl font-semibold text-stone-100">{analytics.tasksCompleted}</p>
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
              <p className="text-lg md:text-2xl font-semibold text-stone-100">{analytics.productivity}%</p>
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
              <p className="text-lg md:text-2xl font-semibold text-stone-100">{analytics.streakDays} days</p>
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
              <p className="text-lg md:text-2xl font-semibold text-stone-100">{analytics.averageCompletionTime}d</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <h3 className="text-base md:text-lg font-medium text-stone-100 mb-4">Weekly Productivity</h3>
          <div className="space-y-3">
            {days.map((day, index) => (
              <div key={day} className="flex items-center space-x-3">
                <span className="w-8 text-xs text-stone-600">{day}</span>
                <div className="flex-1">
                  <ProgressBar value={weeklyData[index]} size="sm" />
                </div>
                <span className="w-8 text-xs text-stone-400 text-right">{weeklyData[index]}%</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-base md:text-lg font-medium text-stone-100 mb-4">Task Distribution</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs md:text-sm text-stone-400">Completed</span>
              <span className="text-xs md:text-sm font-medium text-stone-100">{analytics.tasksCompleted}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs md:text-sm text-stone-400">In Progress</span>
              <span className="text-xs md:text-sm font-medium text-stone-100">
                {state.tasks.filter(t => t.status === 'in-progress').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs md:text-sm text-stone-400">To Do</span>
              <span className="text-xs md:text-sm font-medium text-stone-100">
                {state.tasks.filter(t => t.status === 'todo').length}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Goal Progress */}
      <Card>
        <h3 className="text-base md:text-lg font-medium text-stone-100 mb-4">Goal Progress</h3>
        <div className="space-y-4">
          {state.goals.map(goal => (
            <div key={goal.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm md:text-base font-medium text-stone-100">{goal.title}</span>
                <span className="text-xs md:text-sm text-stone-400">{goal.progress}%</span>
              </div>
              <ProgressBar value={goal.progress} color="green" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}