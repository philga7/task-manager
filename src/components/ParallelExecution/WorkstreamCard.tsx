import React from 'react';
import { Workstream } from '../../types';
import { Card } from '../UI/Card';
import { AgentStatusBadge } from './AgentStatusBadge';
import { ProgressBar } from '../UI/ProgressBar';

interface WorkstreamCardProps {
  workstream: Workstream;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;
}

export function WorkstreamCard({ 
  workstream, 
  isExpanded = false, 
  onToggleExpand,
  className = '' 
}: WorkstreamCardProps) {


  const statusConfig = {
    pending: { color: 'text-stone-400', icon: '⏳' },
    running: { color: 'text-blue-400', icon: '🔄' },
    completed: { color: 'text-green-400', icon: '✅' },
    blocked: { color: 'text-red-400', icon: '🚫' }
  };

  const priorityConfig = {
    low: { color: 'bg-stone-600', label: 'Low' },
    medium: { color: 'bg-yellow-600', label: 'Medium' },
    high: { color: 'bg-red-600', label: 'High' }
  };

  const config = statusConfig[workstream.status];
  const priority = priorityConfig[workstream.priority];

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getTimeElapsed = () => {
    if (!workstream.startedAt) return null;
    const now = new Date();
    const elapsed = now.getTime() - workstream.startedAt.getTime();
    return Math.floor(elapsed / (1000 * 60)); // minutes
  };

  return (
    <Card 
      className={`transition-all duration-250 ${className}`}
      hover={true}

    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{config.icon}</span>
              <h3 className="text-lg font-semibold text-stone-200 truncate">
                {workstream.name}
              </h3>
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${priority.color} text-white`}>
                {priority.label}
              </span>
            </div>
            <p className="text-stone-400 text-sm line-clamp-2">
              {workstream.description}
            </p>
          </div>
          
          <button
            onClick={onToggleExpand}
            className="ml-4 p-2 text-stone-400 hover:text-stone-200 transition-colors"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>

        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-300">Progress</span>
            <span className="text-stone-400">{workstream.progress}%</span>
          </div>
          <ProgressBar progress={workstream.progress} />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-stone-400">Estimated:</span>
            <span className="text-stone-200 ml-1">
              {formatDuration(workstream.estimatedDuration)}
            </span>
          </div>
          {workstream.actualDuration && (
            <div>
              <span className="text-stone-400">Actual:</span>
              <span className="text-stone-200 ml-1">
                {formatDuration(workstream.actualDuration)}
              </span>
            </div>
          )}
          {workstream.startedAt && (
            <div>
              <span className="text-stone-400">Elapsed:</span>
              <span className="text-stone-200 ml-1">
                {formatDuration(getTimeElapsed() || 0)}
              </span>
            </div>
          )}
          <div>
            <span className="text-stone-400">Agents:</span>
            <span className="text-stone-200 ml-1">
              {workstream.agents.length}
            </span>
          </div>
        </div>

        {/* Agents Section */}
        {isExpanded && (
          <div className="space-y-3 pt-4 border-t border-stone-800">
            <h4 className="text-sm font-medium text-stone-300">Active Agents</h4>
            <div className="space-y-2">
              {workstream.agents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-3 bg-stone-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-stone-700 rounded-full flex items-center justify-center text-sm font-medium">
                      {agent.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-stone-200">{agent.name}</div>
                      <div className="text-xs text-stone-400">{agent.type.replace('-', ' ')}</div>
                    </div>
                  </div>
                  <AgentStatusBadge agent={agent} size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dependencies */}
        {workstream.dependencies.length > 0 && (
          <div className="text-xs text-stone-500">
            Dependencies: {workstream.dependencies.length} workstream(s)
          </div>
        )}
      </div>
    </Card>
  );
}
