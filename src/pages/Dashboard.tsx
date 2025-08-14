import React from 'react';
import { Card } from '../components/UI/Card';
import { ProgressBar } from '../components/UI/ProgressBar';
import { TaskCard } from '../components/Tasks/TaskCard';
import { useApp } from '../context/AppContext';
import { CheckCircle2, Clock, Target, TrendingUp } from 'lucide-react';

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

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-stone-100 mb-2">Dashboard</h1>
        <p className="text-stone-400">Your productivity overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card>
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="p-1.5 md:p-2 bg-green-100 rounded-xl">
              <CheckCircle2 className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-stone-400">Completed</p>
              <p className="text-lg md:text-2xl font-semibold text-stone-100">{completedTasks}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="p-1.5 md:p-2 bg-amber-100 rounded-xl">
              <Clock className="w-4 h-4 md:w-6 md:h-6 text-amber-600" />
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
              <Target className="w-4 h-4 md:w-6 md:h-6 text-red-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-stone-400">Overdue</p>
              <p className="text-lg md:text-2xl font-semibold text-stone-100">{overdueTasks.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="p-1.5 md:p-2 bg-blue-100 rounded-xl">
              <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
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
          <h3 className="text-base md:text-lg font-medium text-stone-100 mb-4">Task Completion</h3>
          <ProgressBar value={completionRate} showLabel />
          <div className="mt-4 text-xs md:text-sm text-stone-400">
            {completedTasks} of {totalTasks} tasks completed
          </div>
        </Card>

        <Card>
          <h3 className="text-base md:text-lg font-medium text-stone-100 mb-4">Active Projects</h3>
          <div className="space-y-3">
            {state.projects.slice(0, 3).map(project => (
              <div key={project.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="text-xs md:text-sm font-medium text-stone-100">{project.name}</span>
                </div>
                <span className="text-xs md:text-sm text-stone-400">{project.progress}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Tasks */}
      <Card>
        <h3 className="text-base md:text-lg font-medium text-stone-100 mb-4">Recent Tasks</h3>
        <div className="space-y-3">
          {recentTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </Card>
    </div>
  );
}