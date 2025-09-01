import React, { useState, useMemo } from 'react';
import { 
  ContextNode, 
  ContextRelationship, 
  ContextSearchFilter, 
  ContextPerformanceMetrics,
  ContextExport 
} from '../../types';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { ContextSearch } from './ContextSearch';
import { ContextGraph } from './ContextGraph';

interface ContextExplorerProps {
  className?: string;
}

// Mock data for demonstration
const mockContextNodes: ContextNode[] = [
  {
    id: 'ctx-1',
    name: 'User Authentication System',
    description: 'Complete authentication flow with JWT tokens',
    type: 'project',
    content: 'Implement secure user authentication with JWT tokens, password hashing, and session management...',
    metadata: {
      createdBy: 'agent-1',
      createdAt: new Date(Date.now() - 3600000),
      lastModified: new Date(Date.now() - 1800000),
      version: 3,
      tags: ['security', 'authentication', 'jwt'],
      priority: 'high',
      status: 'active'
    },
    dependencies: ['ctx-2'],
    permissions: {
      read: ['agent-1', 'agent-2'],
      write: ['agent-1'],
      admin: ['agent-1']
    },
    performance: {
      accessCount: 45,
      lastAccessed: new Date(Date.now() - 300000),
      relevanceScore: 0.95
    }
  },
  {
    id: 'ctx-2',
    name: 'Database Schema Design',
    description: 'User table schema and relationships',
    type: 'task',
    content: 'Design database schema for user management including users, roles, permissions tables...',
    metadata: {
      createdBy: 'agent-2',
      createdAt: new Date(Date.now() - 7200000),
      lastModified: new Date(Date.now() - 3600000),
      version: 2,
      tags: ['database', 'schema', 'sql'],
      priority: 'high',
      status: 'active'
    },
    dependencies: [],
    permissions: {
      read: ['agent-1', 'agent-2', 'agent-3'],
      write: ['agent-2'],
      admin: ['agent-2']
    },
    performance: {
      accessCount: 32,
      lastAccessed: new Date(Date.now() - 600000),
      relevanceScore: 0.88
    }
  },
  {
    id: 'ctx-3',
    name: 'API Documentation',
    description: 'REST API documentation and examples',
    type: 'custom',
    content: 'Generate comprehensive API documentation with OpenAPI specification, examples, and testing endpoints...',
    metadata: {
      createdBy: 'agent-3',
      createdAt: new Date(Date.now() - 5400000),
      lastModified: new Date(Date.now() - 900000),
      version: 1,
      tags: ['api', 'documentation', 'openapi'],
      priority: 'medium',
      status: 'active'
    },
    dependencies: ['ctx-1'],
    permissions: {
      read: ['agent-1', 'agent-2', 'agent-3'],
      write: ['agent-3'],
      admin: ['agent-3']
    },
    performance: {
      accessCount: 18,
      lastAccessed: new Date(Date.now() - 1200000),
      relevanceScore: 0.72
    }
  },
  {
    id: 'ctx-4',
    name: 'Frontend Components',
    description: 'React components for authentication UI',
    type: 'workstream',
    content: 'Create React components for login, registration, password reset, and user profile management...',
    metadata: {
      createdBy: 'agent-1',
      createdAt: new Date(Date.now() - 2700000),
      lastModified: new Date(Date.now() - 450000),
      version: 4,
      tags: ['frontend', 'react', 'ui'],
      priority: 'medium',
      status: 'active'
    },
    dependencies: ['ctx-1', 'ctx-3'],
    permissions: {
      read: ['agent-1', 'agent-2'],
      write: ['agent-1'],
      admin: ['agent-1']
    },
    performance: {
      accessCount: 28,
      lastAccessed: new Date(Date.now() - 180000),
      relevanceScore: 0.85
    }
  }
];

const mockRelationships: ContextRelationship[] = [
  {
    id: 'rel-1',
    fromNodeId: 'ctx-1',
    toNodeId: 'ctx-2',
    type: 'depends_on',
    strength: 0.9,
    bidirectional: false,
    metadata: {
      createdBy: 'agent-1',
      createdAt: new Date(Date.now() - 3600000),
      description: 'Authentication system depends on database schema'
    }
  },
  {
    id: 'rel-2',
    fromNodeId: 'ctx-3',
    toNodeId: 'ctx-1',
    type: 'related_to',
    strength: 0.7,
    bidirectional: true,
    metadata: {
      createdBy: 'agent-3',
      createdAt: new Date(Date.now() - 5400000),
      description: 'API documentation relates to authentication system'
    }
  },
  {
    id: 'rel-3',
    fromNodeId: 'ctx-4',
    toNodeId: 'ctx-1',
    type: 'depends_on',
    strength: 0.8,
    bidirectional: false,
    metadata: {
      createdBy: 'agent-1',
      createdAt: new Date(Date.now() - 2700000),
      description: 'Frontend components depend on authentication system'
    }
  },
  {
    id: 'rel-4',
    fromNodeId: 'ctx-4',
    toNodeId: 'ctx-3',
    type: 'depends_on',
    strength: 0.6,
    bidirectional: false,
    metadata: {
      createdBy: 'agent-1',
      createdAt: new Date(Date.now() - 2700000),
      description: 'Frontend components depend on API documentation'
    }
  }
];

export function ContextExplorer({ className = '' }: ContextExplorerProps) {
  const [nodes, setNodes] = useState<ContextNode[]>(mockContextNodes);
  const [relationships, setRelationships] = useState<ContextRelationship[]>(mockRelationships);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [searchFilters, setSearchFilters] = useState<ContextSearchFilter>({});
  const [activeTab, setActiveTab] = useState<'graph' | 'list' | 'performance'>('graph');
  const [isExporting, setIsExporting] = useState(false);

  // Filter nodes based on search criteria
  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      if (searchFilters.type && node.type !== searchFilters.type) return false;
      if (searchFilters.status && node.metadata.status !== searchFilters.status) return false;
      if (searchFilters.priority && node.metadata.priority !== searchFilters.priority) return false;
      if (searchFilters.createdBy && node.metadata.createdBy !== searchFilters.createdBy) return false;
      if (searchFilters.tags && searchFilters.tags.length > 0) {
        const hasMatchingTag = searchFilters.tags.some(tag => node.metadata.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }
      if (searchFilters.searchTerm) {
        const searchLower = searchFilters.searchTerm.toLowerCase();
        const matchesSearch = 
          node.name.toLowerCase().includes(searchLower) ||
          node.description.toLowerCase().includes(searchLower) ||
          node.content.toLowerCase().includes(searchLower) ||
          node.metadata.tags.some(tag => tag.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [nodes, searchFilters]);

  // Calculate performance metrics
  const performanceMetrics = useMemo((): ContextPerformanceMetrics => {
    const totalNodes = nodes.length;
    const activeNodes = nodes.filter(node => node.metadata.status === 'active').length;
    const averageAccessCount = nodes.reduce((sum, node) => sum + node.performance.accessCount, 0) / totalNodes;
    const mostAccessedNodes = [...nodes]
      .sort((a, b) => b.performance.accessCount - a.performance.accessCount)
      .slice(0, 5);
    
    const recentActivity = nodes.flatMap(node => [
      {
        nodeId: node.id,
        action: 'accessed' as const,
        timestamp: node.performance.lastAccessed,
        user: node.metadata.createdBy
      }
    ]).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);

    return {
      totalNodes,
      activeNodes,
      averageAccessCount,
      mostAccessedNodes,
      recentActivity,
      storageUsage: {
        totalSize: totalNodes * 1024, // Mock size calculation
        nodeCount: totalNodes,
        averageNodeSize: 1024
      }
    };
  }, [nodes]);

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodes(prev => [...prev, nodeId]);
  };

  const handleNodeDeselect = (nodeId: string) => {
    setSelectedNodes(prev => prev.filter(id => id !== nodeId));
  };

  const handleSearch = (searchTerm: string) => {
    setSearchFilters(prev => ({ ...prev, searchTerm }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportData: ContextExport = {
        nodes: filteredNodes,
        relationships: relationships.filter(rel => 
          filteredNodes.some(node => node.id === rel.fromNodeId || node.id === rel.toNodeId)
        ),
        versions: [], // Mock versions
        metadata: {
          exportedAt: new Date(),
          exportedBy: 'current-user',
          version: '1.0.0',
          description: 'Context export from ContextExplorer'
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `context-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData: ContextExport = JSON.parse(e.target?.result as string);
        setNodes(importData.nodes);
        setRelationships(importData.relationships);
      } catch (error) {
        console.error('Import failed:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Context Explorer
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Explore and manage shared context between parallel agents
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="context-import"
          />
          <label htmlFor="context-import">
            <Button variant="outline" as="span">
              Import Context
            </Button>
          </label>
          <Button 
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
          >
            {isExporting ? 'Exporting...' : 'Export Context'}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <ContextSearch
        nodes={nodes}
        filters={searchFilters}
        onFiltersChange={setSearchFilters}
        onSearch={handleSearch}
      />

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'graph', label: 'Dependency Graph', icon: '🔗' },
            { id: 'list', label: 'Context List', icon: '📋' },
            { id: 'performance', label: 'Performance', icon: '📊' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'graph' | 'list' | 'performance')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'graph' && (
          <ContextGraph
            nodes={filteredNodes}
            relationships={relationships}
            selectedNodes={selectedNodes}
            onNodeSelect={handleNodeSelect}
            onNodeDeselect={handleNodeDeselect}
          />
        )}

        {activeTab === 'list' && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Context Nodes ({filteredNodes.length})
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedNodes.length} selected
              </div>
            </div>

            <div className="space-y-3">
              {filteredNodes.map(node => (
                <div
                  key={node.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedNodes.includes(node.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => handleNodeSelect(node.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {node.name}
                        </h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          node.metadata.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                          node.metadata.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        }`}>
                          {node.metadata.priority}
                        </span>
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                          {node.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {node.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>Created by {node.metadata.createdBy}</span>
                        <span>Version {node.metadata.version}</span>
                        <span>Accessed {node.performance.accessCount} times</span>
                        <span>Last accessed {node.performance.lastAccessed.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'performance' && (
          <Card className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Performance Metrics
            </h3>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {performanceMetrics.totalNodes}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Total Nodes</div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {performanceMetrics.activeNodes}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">Active Nodes</div>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round(performanceMetrics.averageAccessCount)}
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400">Avg Access Count</div>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {performanceMetrics.storageUsage.totalSize}KB
                </div>
                <div className="text-sm text-orange-600 dark:text-orange-400">Storage Used</div>
              </div>
            </div>

            {/* Most Accessed Nodes */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                Most Accessed Nodes
              </h4>
              <div className="space-y-2">
                {performanceMetrics.mostAccessedNodes.map((node, index) => (
                  <div key={node.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        #{index + 1}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {node.name}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {node.performance.accessCount} accesses
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                Recent Activity
              </h4>
              <div className="space-y-2">
                {performanceMetrics.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        activity.action === 'created' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                        activity.action === 'modified' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                        activity.action === 'accessed' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                        'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {activity.action}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {nodes.find(n => n.id === activity.nodeId)?.name || activity.nodeId}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {activity.timestamp.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
