import React from 'react';
import { Agent } from '../../types';

interface AgentStatusBadgeProps {
  agent: Agent;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export function AgentStatusBadge({ agent, size = 'md', showDetails = false }: AgentStatusBadgeProps) {
  const statusConfig = {
    idle: { color: 'bg-stone-600 text-stone-200', icon: '⏸️', label: 'Idle' },
    running: { color: 'bg-blue-600 text-white', icon: '🔄', label: 'Running' },
    completed: { color: 'bg-green-600 text-white', icon: '✅', label: 'Completed' },
    blocked: { color: 'bg-red-600 text-white', icon: '🚫', label: 'Blocked' },
    error: { color: 'bg-red-800 text-white', icon: '❌', label: 'Error' }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const config = statusConfig[agent.status];

  return (
    <div className="flex items-center space-x-2">
      <span
        className={`
          inline-flex items-center space-x-1.5 rounded-lg font-medium
          ${config.color} ${sizeClasses[size]}
        `}
      >
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </span>
      
      {showDetails && (
        <div className="text-xs text-stone-400">
          <div>Type: {agent.type.replace('-', ' ')}</div>
          <div>Success: {agent.performance.successRate}%</div>
        </div>
      )}
    </div>
  );
}
