import React, { useState, useEffect, useMemo } from 'react';
import { Workstream, Agent, CCPMWorkstream } from '../../types';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { WorkstreamCard } from './WorkstreamCard';
import { AgentStatusBadge } from './AgentStatusBadge';
import { useCCPMSync } from '../../hooks/useCCPMSync';

interface ParallelExecutionViewProps {
  className?: string;
  // For demo purposes, we'll use mock data
  // In a real implementation, this would come from props or context
}

// Mock data for demonstration
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
    lastActivity: new Date()
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
    lastActivity: new Date(Date.now() - 300000) // 5 minutes ago
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
    lastActivity: new Date()
  }
];

const mockWorkstreams: Workstream[] = [
  {
    id: 'ws-1',
    name: 'User Authentication System',
    description: 'Implement secure user authentication with JWT tokens and password hashing',
    agents: [mockAgents[0], mockAgents[1]],
    status: 'running',
    progress: 65,
    dependencies: [],
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    startedAt: new Date(Date.now() - 3600000),
    priority: 'high',
    estimatedDuration: 120,
    actualDuration: 65
  },
  {
    id: 'ws-2',
    name: 'Database Schema Migration',
    description: 'Update database schema to support new user roles and permissions',
    agents: [mockAgents[2]],
    status: 'pending',
    progress: 0,
    dependencies: ['ws-1'],
    createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
    priority: 'medium',
    estimatedDuration: 90
  },
  {
    id: 'ws-3',
    name: 'API Documentation',
    description: 'Generate comprehensive API documentation with OpenAPI specification',
    agents: [],
    status: 'completed',
    progress: 100,
    dependencies: [],
    createdAt: new Date(Date.now() - 7200000), // 2 hours ago
    startedAt: new Date(Date.now() - 7200000),
    completedAt: new Date(Date.now() - 1800000),
    priority: 'low',
    estimatedDuration: 60,
    actualDuration: 45
  }
];

export function ParallelExecutionView({ className = '' }: ParallelExecutionViewProps) {
  const [workstreams, setWorkstreams] = useState<Workstream[]>(mockWorkstreams);
  const [agents] = useState<Agent[]>(mockAgents);
  const [expandedWorkstreams, setExpandedWorkstreams] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<'all' | 'running' | 'pending' | 'completed' | 'blocked'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'progress' | 'created' | 'name'>('priority');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // CCPM integration
  const { ccpmSync, getCCPMWorkstreams, migrateHighPriorityTasks } = useCCPMSync();
  const [ccpmWorkstreams, setCcpmWorkstreams] = useState<CCPMWorkstream[]>([]);
  const [showCCPMWorkstreams, setShowCCPMWorkstreams] = useState(false);

  // Load CCPM workstreams when component mounts
  useEffect(() => {
    if (ccpmSync.isEnabled && ccpmSync.isConnected) {
      loadCCPMWorkstreams();
    }
  }, [ccpmSync.isEnabled, ccpmSync.isConnected]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      
      // Simulate progress updates
      setWorkstreams(prev => prev.map(ws => {
        if (ws.status === 'running' && ws.progress < 100) {
          return {
            ...ws,
            progress: Math.min(ws.progress + Math.random() * 5, 100)
          };
        }
        return ws;
      }));
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Load CCPM workstreams
  const loadCCPMWorkstreams = async () => {
    try {
      const workstreams = await getCCPMWorkstreams();
      setCcpmWorkstreams(workstreams);
    } catch (error) {
      console.error('Failed to load CCPM workstreams:', error);
    }
  };

  // Handle task migration
  const handleMigrateTasks = async () => {
    try {
      const result = await migrateHighPriorityTasks();
      console.log(`Migration completed: ${result.migrated} tasks migrated`);
      // Reload CCPM workstreams after migration
      await loadCCPMWorkstreams();
    } catch (error) {
      console.error('Failed to migrate tasks:', error);
    }
  };

  // Filter and sort workstreams
  const filteredAndSortedWorkstreams = useMemo(() => {
    let filtered = workstreams;
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(ws => ws.status === filterStatus);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority': {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        case 'progress':
          return b.progress - a.progress;
        case 'created':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [workstreams, filterStatus, sortBy]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = workstreams.length;
    const running = workstreams.filter(ws => ws.status === 'running').length;
    const completed = workstreams.filter(ws => ws.status === 'completed').length;
    const pending = workstreams.filter(ws => ws.status === 'pending').length;
    const blocked = workstreams.filter(ws => ws.status === 'blocked').length;
    
    const activeAgents = agents.filter(agent => agent.status === 'running').length;
    const totalAgents = agents.length;

    return { total, running, completed, pending, blocked, activeAgents, totalAgents };
  }, [workstreams, agents]);

  const toggleWorkstreamExpansion = (workstreamId: string) => {
    setExpandedWorkstreams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workstreamId)) {
        newSet.delete(workstreamId);
      } else {
        newSet.add(workstreamId);
      }
      return newSet;
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-stone-200">Parallel Execution Dashboard</h1>
          <p className="text-stone-400 mt-1">
            Monitor agent workstreams and execution progress in real-time
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {ccpmSync.isEnabled && ccpmSync.isConnected && (
            <div className="flex items-center space-x-2">
              <Button 
                onClick={handleMigrateTasks} 
                variant="secondary" 
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Migrate to CCPM
              </Button>
              <Button 
                onClick={() => setShowCCPMWorkstreams(!showCCPMWorkstreams)} 
                variant="secondary" 
                size="sm"
                className={showCCPMWorkstreams ? 'bg-green-600 hover:bg-green-700' : 'bg-stone-600 hover:bg-stone-700'}
              >
                {showCCPMWorkstreams ? 'Hide CCPM' : 'Show CCPM'}
              </Button>
            </div>
          )}
          <div className="text-sm text-stone-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      <Card className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-stone-200">{metrics.total}</div>
            <div className="text-sm text-stone-400">Total Workstreams</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{metrics.running}</div>
            <div className="text-sm text-stone-400">Running</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{metrics.completed}</div>
            <div className="text-sm text-stone-400">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-stone-400">{metrics.pending}</div>
            <div className="text-sm text-stone-400">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{metrics.blocked}</div>
            <div className="text-sm text-stone-400">Blocked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-stone-200">{metrics.activeAgents}</div>
            <div className="text-sm text-stone-400">Active Agents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-stone-200">{metrics.totalAgents}</div>
            <div className="text-sm text-stone-400">Total Agents</div>
          </div>
        </div>
      </Card>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex flex-wrap gap-2">
          {(['all', 'running', 'pending', 'completed', 'blocked'] as const).map(status => (
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
            onChange={(e) => setSortBy(e.target.value as 'priority' | 'progress' | 'created' | 'name')}
            className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-sm text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-500"
          >
            <option value="priority">Priority</option>
            <option value="progress">Progress</option>
            <option value="created">Created</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {/* Workstreams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAndSortedWorkstreams.map(workstream => (
          <WorkstreamCard
            key={workstream.id}
            workstream={workstream}
            isExpanded={expandedWorkstreams.has(workstream.id)}
            onToggleExpand={() => toggleWorkstreamExpansion(workstream.id)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredAndSortedWorkstreams.length === 0 && (
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-lg font-semibold text-stone-200 mb-2">No Workstreams Found</h3>
          <p className="text-stone-400">
            No workstreams match the current filter criteria.
          </p>
        </Card>
      )}

      {/* CCPM Workstreams */}
      {showCCPMWorkstreams && ccpmSync.isEnabled && ccpmSync.isConnected && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <h3 className="text-lg font-semibold text-stone-200">CCPM Workstreams</h3>
            <span className="text-sm text-stone-400">({ccpmWorkstreams.length} workstreams)</span>
          </div>
          
          {ccpmWorkstreams.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {ccpmWorkstreams.map(workstream => (
                <Card key={workstream.id} className="p-4 border-l-4 border-blue-500">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-stone-200">{workstream.name}</h4>
                      <p className="text-sm text-stone-400">{workstream.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        workstream.status === 'running' ? 'bg-blue-100 text-blue-800' :
                        workstream.status === 'completed' ? 'bg-green-100 text-green-800' :
                        workstream.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        workstream.status === 'blocked' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {workstream.status}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        workstream.priority === 'high' ? 'bg-red-100 text-red-800' :
                        workstream.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {workstream.priority}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-stone-400">Duration:</span>
                      <span className="text-stone-200 ml-2">
                        {workstream.estimatedDuration} min
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400">Agents:</span>
                      <span className="text-stone-200 ml-2">
                        {workstream.assignedAgents.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400">Dependencies:</span>
                      <span className="text-stone-200 ml-2">
                        {workstream.dependencies.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400">Created:</span>
                      <span className="text-stone-200 ml-2">
                        {workstream.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-8 border-l-4 border-blue-500">
              <div className="text-4xl mb-2">🔗</div>
              <h4 className="text-md font-medium text-stone-200 mb-2">No CCPM Workstreams</h4>
              <p className="text-stone-400 text-sm">
                No workstreams found in CCPM. Try migrating some high-priority tasks.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Agent Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-stone-200 mb-4">Agent Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(agent => (
            <div key={agent.id} className="flex items-center justify-between p-4 bg-stone-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-stone-700 rounded-full flex items-center justify-center text-sm font-medium">
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
      </Card>
    </div>
  );
}
