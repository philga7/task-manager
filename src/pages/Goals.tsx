import React from 'react';
import { useState } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { ProgressBar } from '../components/UI/ProgressBar';
import { GoalForm } from '../components/Goals/GoalForm';
import { useApp } from '../context/AppContext';
import { Plus, Target, Calendar, CheckCircle2, Circle } from 'lucide-react';
import { format } from 'date-fns';

export function Goals() {
  const { state } = useApp();
  const [showGoalForm, setShowGoalForm] = useState(false);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-stone-100 mb-2">Goals</h1>
          <p className="text-stone-400">{state.goals.length} active goals</p>
        </div>
        <Button onClick={() => setShowGoalForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Goal
        </Button>
      </div>

      <div className="space-y-4 md:space-y-6">
        {state.goals.map(goal => {
          const completedMilestones = goal.milestones.filter(m => m.completed).length;
          const totalMilestones = goal.milestones.length;
          const milestoneProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

          return (
            <Card key={goal.id} padding="lg">
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <Target className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
                      <h3 className="text-lg md:text-xl font-semibold text-stone-100">{goal.title}</h3>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-3">
                    <h4 className="text-sm md:text-base font-medium text-stone-100">Overall Progress</h4>
                    <ProgressBar value={goal.progress} showLabel color="green" />
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm md:text-base font-medium text-stone-100">Milestone Progress</h4>
                    <ProgressBar value={milestoneProgress} showLabel color="blue" />
                    <p className="text-xs md:text-sm text-stone-400">
                      {completedMilestones} of {totalMilestones} milestones completed
                    </p>
                  </div>
                </div>

                {goal.milestones.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm md:text-base font-medium text-stone-100">Milestones</h4>
                    <div className="space-y-2">
                      {goal.milestones.map(milestone => (
                        <div key={milestone.id} className="flex items-center space-x-3">
                          {milestone.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-stone-400" />
                          )}
                          <span className={`flex-1 text-sm md:text-base ${milestone.completed ? 'line-through text-stone-500' : 'text-stone-300'}`}>
                            {milestone.title}
                          </span>
                          {milestone.completedAt && (
                            <span className="text-xs text-stone-500">
                              {format(milestone.completedAt, 'MMM d')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {state.goals.length === 0 && (
        <div className="text-center py-12">
          <p className="text-stone-400">No goals yet. Set your first goal to start tracking progress.</p>
        </div>
      )}

      {showGoalForm && (
        <GoalForm onClose={() => setShowGoalForm(false)} />
      )}
    </div>
  );
}