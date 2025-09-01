import React, { useMemo, useState } from 'react';
import { ContextNode, ContextRelationship } from '../../types';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';

interface ContextGraphProps {
  nodes: ContextNode[];
  relationships: ContextRelationship[];
  selectedNodes: string[];
  onNodeSelect: (nodeId: string) => void;
  onNodeDeselect: (nodeId: string) => void;
  className?: string;
}

interface GraphNode {
  id: string;
  node: ContextNode;
  x: number;
  y: number;
  connections: string[];
  level: number;
}

interface GraphConnection {
  id: string;
  from: string;
  to: string;
  relationship: ContextRelationship;
  strength: number;
}

export function ContextGraph({ 
  nodes, 
  relationships, 
  selectedNodes, 
  onNodeSelect, 
  onNodeDeselect, 
  className = '' 
}: ContextGraphProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Calculate graph layout
  const graphData = useMemo(() => {
    if (nodes.length === 0) return { graphNodes: [], connections: [] };

    // Create a map of node connections
    const nodeConnections = new Map<string, string[]>();
    const connections: GraphConnection[] = [];

    // Build connections map
    relationships.forEach(rel => {
      if (!nodeConnections.has(rel.fromNodeId)) {
        nodeConnections.set(rel.fromNodeId, []);
      }
      if (!nodeConnections.has(rel.toNodeId)) {
        nodeConnections.set(rel.toNodeId, []);
      }
      
      nodeConnections.get(rel.fromNodeId)!.push(rel.toNodeId);
      nodeConnections.get(rel.toNodeId)!.push(rel.fromNodeId);

      connections.push({
        id: rel.id,
        from: rel.fromNodeId,
        to: rel.toNodeId,
        relationship: rel,
        strength: rel.strength
      });
    });

    // Calculate node levels (topological sort for DAG-like structure)
    const nodeLevels = new Map<string, number>();
    const visited = new Set<string>();

    const calculateLevel = (nodeId: string, level: number = 0): number => {
      if (visited.has(nodeId)) {
        return nodeLevels.get(nodeId) || 0;
      }

      visited.add(nodeId);
      const connections = nodeConnections.get(nodeId) || [];
      let maxLevel = level;

      connections.forEach(connectedId => {
        const connectedLevel = calculateLevel(connectedId, level + 1);
        maxLevel = Math.max(maxLevel, connectedLevel);
      });

      nodeLevels.set(nodeId, maxLevel);
      return maxLevel;
    };

    // Calculate levels for all nodes
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        calculateLevel(node.id);
      }
    });

    // Create graph nodes with positions
    const graphNodes: GraphNode[] = nodes.map(node => {
      const level = nodeLevels.get(node.id) || 0;
      const connections = nodeConnections.get(node.id) || [];
      
      // Simple grid layout
      const nodesInLevel = nodes.filter(n => (nodeLevels.get(n.id) || 0) === level);
      const nodeIndex = nodesInLevel.findIndex(n => n.id === node.id);
      const levelWidth = Math.max(nodesInLevel.length, 1);
      
      const x = (nodeIndex / (levelWidth - 1)) * 800 - 400; // Center around 0
      const y = level * 150 - 300; // Vertical spacing

      return {
        id: node.id,
        node,
        x,
        y,
        connections,
        level
      };
    });

    return { graphNodes, connections };
  }, [nodes, relationships]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleNodeClick = (nodeId: string) => {
    if (selectedNodes.includes(nodeId)) {
      onNodeDeselect(nodeId);
    } else {
      onNodeSelect(nodeId);
    }
  };

  const getNodeColor = (node: ContextNode) => {
    const typeColors = {
      task: 'bg-blue-500',
      project: 'bg-green-500',
      goal: 'bg-purple-500',
      agent: 'bg-orange-500',
      workstream: 'bg-red-500',
      custom: 'bg-gray-500'
    };
    return typeColors[node.type] || 'bg-gray-500';
  };

  const getNodeBorderColor = (nodeId: string) => {
    return selectedNodes.includes(nodeId) 
      ? 'border-2 border-yellow-400' 
      : 'border border-gray-300 dark:border-gray-600';
  };

  if (nodes.length === 0) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <div className="text-gray-500 dark:text-gray-400">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>No context nodes available</p>
          <p className="text-sm">Create some context nodes to see the dependency graph</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Context Dependency Graph
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 0.3}
          >
            Zoom Out
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
          >
            Zoom In
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Graph Container */}
      <div 
        className="relative w-full h-96 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          className="w-full h-full"
          viewBox="-500 -400 1000 800"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center'
          }}
        >
          {/* Connections */}
          {graphData.connections.map(connection => {
            const fromNode = graphData.graphNodes.find(n => n.id === connection.from);
            const toNode = graphData.graphNodes.find(n => n.id === connection.to);
            
            if (!fromNode || !toNode) return null;

            const strokeWidth = Math.max(1, connection.strength * 3);
            const opacity = 0.3 + (connection.strength * 0.7);

            return (
              <line
                key={connection.id}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke="#6B7280"
                strokeWidth={strokeWidth}
                opacity={opacity}
                markerEnd="url(#arrowhead)"
              />
            );
          })}

          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#6B7280"
              />
            </marker>
          </defs>

          {/* Nodes */}
          {graphData.graphNodes.map(graphNode => (
            <g key={graphNode.id}>
              {/* Node circle */}
              <circle
                cx={graphNode.x}
                cy={graphNode.y}
                r="20"
                className={`${getNodeColor(graphNode.node)} ${getNodeBorderColor(graphNode.id)} cursor-pointer transition-all duration-200 hover:scale-110`}
                onClick={() => handleNodeClick(graphNode.id)}
              />
              
              {/* Node label */}
              <text
                x={graphNode.x}
                y={graphNode.y + 35}
                textAnchor="middle"
                className="text-xs font-medium fill-gray-700 dark:fill-gray-300 pointer-events-none"
              >
                {graphNode.node.name.length > 12 
                  ? graphNode.node.name.substring(0, 12) + '...' 
                  : graphNode.node.name
                }
              </text>
              
              {/* Node type indicator */}
              <text
                x={graphNode.x}
                y={graphNode.y + 50}
                textAnchor="middle"
                className="text-xs fill-gray-500 dark:fill-gray-400 pointer-events-none"
              >
                {graphNode.node.type}
              </text>
            </g>
          ))}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Node Types</h4>
          <div className="space-y-1">
            {['task', 'project', 'goal', 'agent', 'workstream', 'custom'].map(type => (
              <div key={type} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getNodeColor({ type } as ContextNode)}`} />
                <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Connection strength legend */}
        <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Connection Strength</h4>
          <div className="space-y-1">
            {[0.2, 0.5, 0.8].map(strength => (
              <div key={strength} className="flex items-center gap-2">
                <div 
                  className="h-1 bg-gray-400 rounded"
                  style={{ width: `${Math.max(1, strength * 3) * 4}px` }}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">{Math.round(strength * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Graph Info */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        <p>Nodes: {nodes.length} | Connections: {relationships.length} | Selected: {selectedNodes.length}</p>
        <p>Click nodes to select/deselect. Drag to pan. Use zoom controls to adjust view.</p>
      </div>
    </Card>
  );
}
