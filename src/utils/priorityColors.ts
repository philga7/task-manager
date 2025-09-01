import { TaskPriority } from '../types';

export interface PriorityColorScheme {
  background: string;
  border: string;
  text: string;
  icon: string;
}

export const getPriorityColorScheme = (priority: TaskPriority): PriorityColorScheme => {
  switch (priority) {
    case 'high':
      return {
        background: 'bg-red-950/20',
        border: 'border-red-800/50',
        text: 'text-red-100',
        icon: 'text-red-500'
      };
    case 'medium':
      return {
        background: 'bg-amber-950/20',
        border: 'border-amber-800/50',
        text: 'text-amber-100',
        icon: 'text-amber-500'
      };
    case 'low':
      return {
        background: 'bg-green-950/20',
        border: 'border-green-800/50',
        text: 'text-green-100',
        icon: 'text-green-500'
      };
    default:
      return {
        background: 'bg-stone-900',
        border: 'border-stone-800',
        text: 'text-stone-100',
        icon: 'text-stone-500'
      };
  }
};

export const getPriorityIconColor = (priority: TaskPriority): string => {
  switch (priority) {
    case 'high':
      return 'text-red-500';
    case 'medium':
      return 'text-amber-500';
    case 'low':
      return 'text-green-500';
    default:
      return 'text-stone-500';
  }
};

// Accessibility helper to ensure color contrast
export const getAccessiblePriorityColor = (priority: TaskPriority): string => {
  // These colors meet WCAG AA contrast requirements
  switch (priority) {
    case 'high':
      return '#ef4444'; // Red-500
    case 'medium':
      return '#f59e0b'; // Amber-500
    case 'low':
      return '#10b981'; // Green-500
    default:
      return '#6b7280'; // Gray-500
  }
};
