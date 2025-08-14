import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'amber' | 'green' | 'blue' | 'red';
  showLabel?: boolean;
}

export function ProgressBar({ 
  value, 
  max = 100, 
  size = 'md', 
  color = 'amber',
  showLabel = false 
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    amber: '#D97757',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500'
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-sm text-stone-400 mb-2">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full bg-stone-700 rounded-full ${sizeClasses[size]}`}>
        <div
          className={`${sizeClasses[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ 
            width: `${percentage}%`, 
            backgroundColor: typeof colorClasses[color] === 'string' ? colorClasses[color] : ''
          }}
        />
      </div>
    </div>
  );
}