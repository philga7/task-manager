import React from 'react';
import { Button } from './Button';
import { Plus, Target, FolderOpen, BarChart3 } from 'lucide-react';

interface EmptyStateProps {
  type: 'tasks' | 'projects' | 'goals' | 'analytics';
  onCreate: () => void;
  className?: string;
}

const getEmptyStateConfig = (type: string) => {
  switch (type) {
    case 'tasks':
      return {
        icon: <Plus className="w-12 h-12 text-stone-500 mb-4" />,
        title: 'No tasks yet',
        description: 'Start by creating your first task to begin organizing your work.',
        buttonText: 'Create your first task',
        buttonIcon: <Plus className="w-4 h-4 mr-2" />
      };
    case 'projects':
      return {
        icon: <FolderOpen className="w-12 h-12 text-stone-500 mb-4" />,
        title: 'No projects yet',
        description: 'Create a project to group related tasks and track progress together.',
        buttonText: 'Create your first project',
        buttonIcon: <Plus className="w-4 h-4 mr-2" />
      };
    case 'goals':
      return {
        icon: <Target className="w-12 h-12 text-stone-500 mb-4" />,
        title: 'No goals yet',
        description: 'Set your first goal to start tracking long-term objectives and milestones.',
        buttonText: 'Create your first goal',
        buttonIcon: <Plus className="w-4 h-4 mr-2" />
      };
    case 'analytics':
      return {
        icon: <BarChart3 className="w-12 h-12 text-stone-500 mb-4" />,
        title: 'No data to analyze yet',
        description: 'Complete some tasks to see your productivity analytics and insights.',
        buttonText: 'Create your first task',
        buttonIcon: <Plus className="w-4 h-4 mr-2" />
      };
    default:
      return {
        icon: <Plus className="w-12 h-12 text-stone-500 mb-4" />,
        title: 'No items yet',
        description: 'Get started by creating your first item.',
        buttonText: 'Create your first item',
        buttonIcon: <Plus className="w-4 h-4 mr-2" />
      };
  }
};

export function EmptyState({ type, onCreate, className = '' }: EmptyStateProps) {
  const config = getEmptyStateConfig(type);

  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="max-w-md mx-auto">
        {config.icon}
        <h3 className="text-lg font-semibold text-stone-200 mb-2">
          {config.title}
        </h3>
        <p className="text-stone-400 mb-6 leading-relaxed">
          {config.description}
        </p>
        <Button onClick={onCreate} className="inline-flex items-center">
          {config.buttonIcon}
          {config.buttonText}
        </Button>
      </div>
    </div>
  );
}
