import React from 'react';
import { Agent, AgentActivity } from '../../types';
import { Card } from '../UI/Card';
import { ProgressBar } from '../UI/ProgressBar';

interface AgentMetricsProps {
  agent: Agent;
  activities?: AgentActivity[];
  className?: string;
}

export function AgentMetrics({ agent, activities = [], className = '' }: AgentMetricsProps) {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-400';
      case 'disconnected': return 'text-red-400';
      case 'error': return 'text-yellow-400';
      default: return 'text-stone-400';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-blue-600';
      default: return 'bg-stone-600';
    }
  };

  const recentActivities = activities
    .filter(activity => activity.agentId === agent.id)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 5);

  const unresolvedErrors = agent.errors.filter(error => !error.resolved);

  return (
    <Card className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-stone-200">Performance Metrics</h3>
        <div className={`text-sm ${getStatusColor(agent.communicationStatus)}`}>
          {agent.communicationStatus}
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-stone-200">{agent.performance.tasksCompleted}</div>
          <div className="text-xs text-stone-400">Tasks Completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{agent.performance.successRate}%</div>
          <div className="text-xs text-stone-400">Success Rate</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{formatDuration(agent.performance.averageExecutionTime)}</div>
          <div className="text-xs text-stone-400">Avg. Time</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">{agent.contextSharing.sharedContexts.length}</div>
          <div className="text-xs text-stone-400">Shared Contexts</div>
        </div>
      </div>

      {/* Resource Usage */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-stone-300">Resource Usage</h4>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs text-stone-400 mb-1">
              <span>CPU</span>
              <span>{agent.resourceUsage.cpu}%</span>
            </div>
            <ProgressBar 
              progress={agent.resourceUsage.cpu} 
              color={agent.resourceUsage.cpu > 80 ? 'red' : agent.resourceUsage.cpu > 60 ? 'yellow' : 'green'}
            />
          </div>
          <div>
            <div className="flex justify-between text-xs text-stone-400 mb-1">
              <span>Memory</span>
              <span>{formatBytes(agent.resourceUsage.memory * 1024 * 1024)}</span>
            </div>
            <ProgressBar 
              progress={(agent.resourceUsage.memory / 1024) * 100} 
              color={(agent.resourceUsage.memory / 1024) > 80 ? 'red' : (agent.resourceUsage.memory / 1024) > 60 ? 'yellow' : 'green'}
            />
          </div>
          <div>
            <div className="flex justify-between text-xs text-stone-400 mb-1">
              <span>Network</span>
              <span>{formatBytes(agent.resourceUsage.network * 1024)}/s</span>
            </div>
            <ProgressBar 
              progress={(agent.resourceUsage.network / 1024) * 100} 
              color={(agent.resourceUsage.network / 1024) > 80 ? 'red' : (agent.resourceUsage.network / 1024) > 60 ? 'yellow' : 'green'}
            />
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-stone-300">Configuration</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-stone-400">Max Tasks:</span>
            <span className="text-stone-200 ml-1">{agent.configuration.maxConcurrentTasks}</span>
          </div>
          <div>
            <span className="text-stone-400">Timeout:</span>
            <span className="text-stone-200 ml-1">{agent.configuration.timeoutMinutes}m</span>
          </div>
          <div>
            <span className="text-stone-400">Retries:</span>
            <span className="text-stone-200 ml-1">{agent.configuration.retryAttempts}</span>
          </div>
          <div>
            <span className="text-stone-400">Priority:</span>
            <span className="text-stone-200 ml-1 capitalize">{agent.configuration.priority}</span>
          </div>
        </div>
      </div>

      {/* Recent Errors */}
      {unresolvedErrors.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-stone-300">Recent Errors</h4>
          <div className="space-y-2">
            {unresolvedErrors.slice(0, 3).map(error => (
              <div key={error.id} className="p-3 bg-stone-800 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-block w-2 h-2 rounded-full ${getSeverityColor(error.severity)}`}></span>
                      <span className="text-sm font-medium text-stone-200 capitalize">{error.severity}</span>
                      <span className="text-xs text-stone-500">
                        {error.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-stone-300">{error.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentActivities.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-stone-300">Recent Activity</h4>
          <div className="space-y-2">
            {recentActivities.map(activity => (
              <div key={activity.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-stone-400">•</span>
                  <span className="text-stone-200 capitalize">{activity.action}</span>
                  {activity.details && (
                    <span className="text-stone-400">- {activity.details}</span>
                  )}
                </div>
                <span className="text-xs text-stone-500">
                  {activity.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
