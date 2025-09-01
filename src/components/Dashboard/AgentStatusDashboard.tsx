import React, { useState, useEffect, useMemo } from 'react';
import { Agent, AgentActivity, AgentConfiguration } from '../../types';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { AgentStatusBadge } from '../ParallelExecution/AgentStatusBadge';
import { AgentMetrics } from './AgentMetrics';
import { AgentControls } from './AgentControls';

interface AgentStatusDashboardProps {
  className?: string;
  // For demo purposes, we'll use mock data
  // In a real implementation, this would come from props or context
}

// Enhanced mock data with new properties
const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'CodeBot',
    type: 'task-executor',
    status: 'running',
    currentTask: 'Implement user authentication',
    performance: {
      tasksCompleted: 15,
      averageExecutionTime: 45,
      successRate: 98
    },
    lastActivity: new Date(),
    isPaused: false,
    isTerminated: false,
    resourceUsage: {
      cpu: 75,
      memory: 512,
      network: 128
    },
    errors: [
      {
        id: 'error-1',
        timestamp: new Date(Date.now() - 300000),
        message: 'Timeout on API call',
        severity: 'medium',
        resolved: false
      }
    ],
    configuration: {
      maxConcurrentTasks: 3,
      timeoutMinutes: 30,
      retryAttempts: 2,
      priority: 'high',
      autoRestart: true,
      logLevel: 'info'
    },
    communicationStatus: 'connected',
    contextSharing: {
      isSharing: true,
      sharedContexts: ['auth-system', 'user-management'],
      lastShared: new Date()
    }
  },
  {
    id: 'agent-2',
    name: 'ReviewBot',
    type: 'code-reviewer',
    status: 'idle',
    performance: {
      tasksCompleted: 8,
      averageExecutionTime: 30,
      successRate: 95
    },
    lastActivity: new Date(Date.now() - 300000),
    isPaused: false,
    isTerminated: false,
    resourceUsage: {
      cpu: 25,
      memory: 256,
      network: 64
    },
    errors: [],
    configuration: {
      maxConcurrentTasks: 2,
      timeoutMinutes: 45,
      retryAttempts: 1,
      priority: 'normal',
      autoRestart: false,
      logLevel: 'warn'
    },
    communicationStatus: 'connected',
    contextSharing: {
      isSharing: false,
      sharedContexts: [],
      lastShared: null
    }
  },
  {
    id: 'agent-3',
    name: 'TestBot',
    type: 'qa-tester',
    status: 'running',
    currentTask: 'Run integration tests',
    performance: {
      tasksCompleted: 12,
      averageExecutionTime: 60,
      successRate: 92
    },
    lastActivity: new Date(),
    isPaused: false,
    isTerminated: false,
    resourceUsage: {
      cpu: 90,
      memory: 768,
      network: 256
    },
    errors: [
      {
        id: 'error-2',
        timestamp: new Date(Date.now() - 60000),
        message: 'Test suite failed',
        severity: 'high',
        resolved: false
      }
    ],
    configuration: {
      maxConcurrentTasks: 1,
      timeoutMinutes: 60,
      retryAttempts: 3,
      priority: 'normal',
      autoRestart: true,
      logLevel: 'debug'
    },
    communicationStatus: 'connected',
    contextSharing: {
      isSharing: true,
      sharedContexts: ['test-results'],
      lastShared: new Date()
    }
  }
];

const mockActivities: AgentActivity[] = [
  {
    id: 'activity-1',
    agentId: 'agent-1',
    timestamp: new Date(Date.now() - 5000),
    action: 'started',
    details: 'Task: Implement user authentication',
    duration: 45
  },
  {
    id: 'activity-2',
    agentId: 'agent-3',
    timestamp: new Date(Date.now() - 10000),
    action: 'error',
    details: 'Test suite failed',
    duration: 30
  },
  {
    id: 'activity-3',
    agentId: 'agent-2',
    timestamp: new Date(Date.now() - 300000),
    action: 'completed',
    details: 'Code review completed',
    duration: 25
  }
];

export function AgentStatusDashboard({ className = '' }: AgentStatusDashboardProps) {
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [activities, setActivities] = useState<AgentActivity[]>(mockActivities);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'running' | 'idle' | 'error' | 'paused'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'performance' | 'lastActivity'>('name');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      
      // Simulate resource usage updates
      setAgents(prev => prev.map(agent => ({
        ...agent,
        resourceUsage: {
          cpu: Math.max(10, Math.min(100, agent.resourceUsage.cpu + (Math.random() - 0.5) * 20)),
          memory: Math.max(128, Math.min(1024, agent.resourceUsage.memory + (Math.random() - 0.5) * 100)),
          network: Math.max(32, Math.min(512, agent.resourceUsage.network + (Math.random() - 0.5) * 50))
        }
      })));
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  // Filter and sort agents
  const filteredAndSortedAgents = useMemo(() => {
    let filtered = agents;
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(agent => agent.status === filterStatus);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          const statusOrder = { running: 4, idle: 3, paused: 2, error: 1, completed: 0 };
          return statusOrder[b.status] - statusOrder[a.status];
        case 'performance':
          return b.performance.successRate - a.performance.successRate;
        case 'lastActivity':
          return b.lastActivity.getTime() - a.lastActivity.getTime();
        default:
          return 0;
      }
    });
  }, [agents, filterStatus, sortBy]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = agents.length;
    const running = agents.filter(agent => agent.status === 'running').length;
    const idle = agents.filter(agent => agent.status === 'idle').length;
    const error = agents.filter(agent => agent.status === 'error').length;
    const paused = agents.filter(agent => agent.status === 'paused').length;
    
    const connected = agents.filter(agent => agent.communicationStatus === 'connected').length;
    const sharing = agents.filter(agent => agent.contextSharing.isSharing).length;
    const totalErrors = agents.reduce((sum, agent) => sum + agent.errors.filter(e => !e.resolved).length, 0);

    return { total, running, idle, error, paused, connected, sharing, totalErrors };
  }, [agents]);

  // Agent management handlers
  const handlePauseAgent = (agentId: string) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: 'paused', isPaused: true }
        : agent
    ));
  };

  const handleResumeAgent = (agentId: string) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: 'running', isPaused: false }
        : agent
    ));
  };

  const handleTerminateAgent = (agentId: string) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: 'terminated', isTerminated: true }
        : agent
    ));
  };

  const handleRestartAgent = (agentId: string) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: 'running', isTerminated: false, errors: [] }
        : agent
    ));
  };

  const handleUpdateConfiguration = (agentId: string, config: Partial<AgentConfiguration>) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, configuration: { ...agent.configuration, ...config } }
        : agent
    ));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-stone-200">Agent Status Dashboard</h1>
          <p className="text-stone-400 mt-1">
            Monitor and manage parallel agent execution in real-time
          </p>
        </div>
        <div className="text-sm text-stone-500">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Metrics Overview */}
      <Card className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-stone-200">{metrics.total}</div>
            <div className="text-sm text-stone-400">Total Agents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{metrics.running}</div>
            <div className="text-sm text-stone-400">Running</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{metrics.idle}</div>
            <div className="text-sm text-stone-400">Idle</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{metrics.error}</div>
            <div className="text-sm text-stone-400">Errors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{metrics.paused}</div>
            <div className="text-sm text-stone-400">Paused</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{metrics.connected}</div>
            <div className="text-sm text-stone-400">Connected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{metrics.sharing}</div>
            <div className="text-sm text-stone-400">Sharing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{metrics.totalErrors}</div>
            <div className="text-sm text-stone-400">Active Errors</div>
          </div>
        </div>
      </Card>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex flex-wrap gap-2">
          {(['all', 'running', 'idle', 'error', 'paused'] as const).map(status => (
            <Button
              key={status}
              variant={filterStatus === status ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilterStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-stone-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-sm text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-500"
          >
            <option value="name">Name</option>
            <option value="status">Status</option>
            <option value="performance">Performance</option>
            <option value="lastActivity">Last Activity</option>
          </select>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAndSortedAgents.map(agent => (
          <Card key={agent.id} className="p-6 space-y-4">
            {/* Agent Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-stone-700 rounded-full flex items-center justify-center text-lg font-bold">
                  {agent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-stone-200">{agent.name}</h3>
                  <p className="text-sm text-stone-400">{agent.type.replace('-', ' ')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <AgentStatusBadge agent={agent} size="sm" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                >
                  {selectedAgent === agent.id ? '▼' : '▶'}
                </Button>
              </div>
            </div>

            {/* Current Task */}
            {agent.currentTask && (
              <div className="p-3 bg-stone-800 rounded-lg">
                <div className="text-sm text-stone-400 mb-1">Current Task</div>
                <div className="text-sm text-stone-200">{agent.currentTask}</div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-stone-200">{agent.performance.tasksCompleted}</div>
                <div className="text-xs text-stone-400">Completed</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-400">{agent.performance.successRate}%</div>
                <div className="text-xs text-stone-400">Success</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-400">{agent.resourceUsage.cpu}%</div>
                <div className="text-xs text-stone-400">CPU</div>
              </div>
            </div>

            {/* Expanded Details */}
            {selectedAgent === agent.id && (
              <div className="space-y-4 pt-4 border-t border-stone-800">
                <AgentMetrics agent={agent} activities={activities} />
                <AgentControls
                  agent={agent}
                  onPause={handlePauseAgent}
                  onResume={handleResumeAgent}
                  onTerminate={handleTerminateAgent}
                  onRestart={handleRestartAgent}
                  onUpdateConfiguration={handleUpdateConfiguration}
                />
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredAndSortedAgents.length === 0 && (
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-lg font-semibold text-stone-200 mb-2">No Agents Found</h3>
          <p className="text-stone-400">
            No agents match the current filter criteria.
          </p>
        </Card>
      )}
    </div>
  );
}
