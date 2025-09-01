import React, { useState } from 'react';
import { Agent, AgentConfiguration } from '../../types';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';

interface AgentControlsProps {
  agent: Agent;
  onPause?: (agentId: string) => void;
  onResume?: (agentId: string) => void;
  onTerminate?: (agentId: string) => void;
  onRestart?: (agentId: string) => void;
  onUpdateConfiguration?: (agentId: string, config: Partial<AgentConfiguration>) => void;
  className?: string;
}

export function AgentControls({ 
  agent, 
  onPause, 
  onResume, 
  onTerminate, 
  onRestart,
  onUpdateConfiguration,
  className = '' 
}: AgentControlsProps) {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [config, setConfig] = useState<AgentConfiguration>(agent.configuration);

  const handleConfigUpdate = () => {
    if (onUpdateConfiguration) {
      onUpdateConfiguration(agent.id, config);
    }
    setIsConfiguring(false);
  };

  const canPause = agent.status === 'running' && !agent.isPaused;
  const canResume = agent.status === 'paused' || agent.isPaused;
  const canTerminate = agent.status !== 'completed' && agent.status !== 'terminated';
  const canRestart = agent.status === 'error' || agent.status === 'terminated';

  return (
    <Card className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-stone-200">Agent Controls</h3>
        <div className="text-sm text-stone-400">
          {agent.isTerminated ? 'Terminated' : agent.isPaused ? 'Paused' : 'Active'}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {canPause && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPause?.(agent.id)}
            className="flex items-center justify-center space-x-2"
          >
            <span>⏸️</span>
            <span>Pause</span>
          </Button>
        )}
        
        {canResume && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onResume?.(agent.id)}
            className="flex items-center justify-center space-x-2"
          >
            <span>▶️</span>
            <span>Resume</span>
          </Button>
        )}
        
        {canTerminate && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onTerminate?.(agent.id)}
            className="flex items-center justify-center space-x-2 text-red-400 hover:text-red-300"
          >
            <span>⏹️</span>
            <span>Terminate</span>
          </Button>
        )}
        
        {canRestart && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onRestart?.(agent.id)}
            className="flex items-center justify-center space-x-2"
          >
            <span>🔄</span>
            <span>Restart</span>
          </Button>
        )}
      </div>

      {/* Configuration Management */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-stone-300">Configuration</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsConfiguring(!isConfiguring)}
            className="text-xs"
          >
            {isConfiguring ? 'Cancel' : 'Edit'}
          </Button>
        </div>

        {isConfiguring ? (
          <div className="space-y-3 p-4 bg-stone-800 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-stone-400 mb-1">Max Concurrent Tasks</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={config.maxConcurrentTasks}
                  onChange={(e) => setConfig({ ...config, maxConcurrentTasks: parseInt(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-stone-700 border border-stone-600 rounded text-sm text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-500"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-400 mb-1">Timeout (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={config.timeoutMinutes}
                  onChange={(e) => setConfig({ ...config, timeoutMinutes: parseInt(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-stone-700 border border-stone-600 rounded text-sm text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-500"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-400 mb-1">Retry Attempts</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={config.retryAttempts}
                  onChange={(e) => setConfig({ ...config, retryAttempts: parseInt(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-stone-700 border border-stone-600 rounded text-sm text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-500"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-400 mb-1">Priority</label>
                <select
                  value={config.priority}
                  onChange={(e) => setConfig({ ...config, priority: e.target.value as 'low' | 'normal' | 'high' })}
                  className="w-full px-3 py-1.5 bg-stone-700 border border-stone-600 rounded text-sm text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.autoRestart}
                  onChange={(e) => setConfig({ ...config, autoRestart: e.target.checked })}
                  className="w-4 h-4 text-stone-600 bg-stone-700 border-stone-600 rounded focus:ring-stone-500"
                />
                <span className="text-sm text-stone-300">Auto Restart</span>
              </label>
            </div>

            <div>
              <label className="block text-xs text-stone-400 mb-1">Log Level</label>
              <select
                value={config.logLevel}
                onChange={(e) => setConfig({ ...config, logLevel: e.target.value as 'debug' | 'info' | 'warn' | 'error' })}
                className="w-full px-3 py-1.5 bg-stone-700 border border-stone-600 rounded text-sm text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-500"
              >
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warn">Warn</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfigUpdate}
                className="flex-1"
              >
                Save Configuration
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setConfig(agent.configuration);
                  setIsConfiguring(false);
                }}
                className="flex-1"
              >
                Reset
              </Button>
            </div>
          </div>
        ) : (
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
            <div>
              <span className="text-stone-400">Auto Restart:</span>
              <span className="text-stone-200 ml-1">{agent.configuration.autoRestart ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="text-stone-400">Log Level:</span>
              <span className="text-stone-200 ml-1 capitalize">{agent.configuration.logLevel}</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-stone-300">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {/* TODO: Implement log viewing */}}
            className="text-xs"
          >
            📋 View Logs
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {/* TODO: Implement debugging */}}
            className="text-xs"
          >
            🐛 Debug Mode
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {/* TODO: Implement context sharing */}}
            className="text-xs"
          >
            🔗 Share Context
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {/* TODO: Implement performance reset */}}
            className="text-xs"
          >
            📊 Reset Stats
          </Button>
        </div>
      </div>
    </Card>
  );
}
