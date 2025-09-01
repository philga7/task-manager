import React, { useState } from 'react';
import { Agent, Workstream, WorkstreamDependency } from '../../types';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Users, GitBranch, Clock, Settings, Plus, Trash2 } from 'lucide-react';

interface ParallelExecutionConfigProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  workstreams: Workstream[];
  onWorkstreamsChange: (workstreams: Workstream[]) => void;
  dependencies: WorkstreamDependency[];
  onDependenciesChange: (dependencies: WorkstreamDependency[]) => void;
  availableAgents: Agent[];
}

export function ParallelExecutionConfig({
  isEnabled,
  onToggle,
  workstreams,
  onWorkstreamsChange,
  dependencies,
  onDependenciesChange,
  availableAgents
}: ParallelExecutionConfigProps) {
  const [showAddWorkstream, setShowAddWorkstream] = useState(false);
  const [newWorkstream, setNewWorkstream] = useState({
    name: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    estimatedDuration: 60,
    agentIds: [] as string[]
  });

  const handleAddWorkstream = () => {
    if (!newWorkstream.name.trim()) return;

    const workstream: Workstream = {
      id: `ws-${Date.now()}`,
      name: newWorkstream.name,
      description: newWorkstream.description,
      agents: availableAgents.filter(agent => newWorkstream.agentIds.includes(agent.id)),
      status: 'pending',
      progress: 0,
      dependencies: [],
      createdAt: new Date(),
      priority: newWorkstream.priority,
      estimatedDuration: newWorkstream.estimatedDuration
    };

    onWorkstreamsChange([...workstreams, workstream]);
    setNewWorkstream({
      name: '',
      description: '',
      priority: 'medium',
      estimatedDuration: 60,
      agentIds: []
    });
    setShowAddWorkstream(false);
  };

  const handleRemoveWorkstream = (workstreamId: string) => {
    onWorkstreamsChange(workstreams.filter(ws => ws.id !== workstreamId));
    // Also remove any dependencies involving this workstream
    onDependenciesChange(dependencies.filter(dep => 
      dep.from !== workstreamId && dep.to !== workstreamId
    ));
  };

  const handleAddDependency = (fromId: string, toId: string, type: 'blocking' | 'sequential' | 'parallel') => {
    const dependency: WorkstreamDependency = {
      from: fromId,
      to: toId,
      type
    };
    onDependenciesChange([...dependencies, dependency]);
  };

  const handleRemoveDependency = (fromId: string, toId: string) => {
    onDependenciesChange(dependencies.filter(dep => 
      !(dep.from === fromId && dep.to === toId)
    ));
  };

  if (!isEnabled) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GitBranch className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-medium text-stone-300">Parallel Execution</h3>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onToggle(true)}
            className="text-xs"
          >
            Enable
          </Button>
        </div>
        <p className="text-xs text-stone-500">
          Enable parallel execution to break down complex tasks into multiple workstreams that can run simultaneously.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <GitBranch className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-medium text-stone-300">Parallel Execution</h3>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onToggle(false)}
          className="text-xs"
        >
          Disable
        </Button>
      </div>

      {/* Workstreams Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium text-stone-400">Workstreams</h4>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowAddWorkstream(true)}
            className="text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Workstream
          </Button>
        </div>

        {workstreams.map((workstream) => (
          <Card key={workstream.id} className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <GitBranch className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-stone-200">{workstream.name}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  workstream.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                  workstream.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {workstream.priority}
                </span>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleRemoveWorkstream(workstream.id)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-xs text-stone-500 mb-2">{workstream.description}</p>
            <div className="flex items-center space-x-4 text-xs text-stone-400">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{workstream.estimatedDuration} min</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>{workstream.agents.length} agents</span>
              </div>
            </div>
          </Card>
        ))}

        {workstreams.length === 0 && (
          <p className="text-xs text-stone-500 text-center py-4">
            No workstreams defined. Add workstreams to enable parallel execution.
          </p>
        )}
      </div>

      {/* Add Workstream Modal */}
      {showAddWorkstream && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-stone-100">Add Workstream</h3>
              <button
                onClick={() => setShowAddWorkstream(false)}
                className="p-1 text-stone-500 hover:text-stone-300 rounded"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={newWorkstream.name}
                  onChange={(e) => setNewWorkstream({ ...newWorkstream, name: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  placeholder="Enter workstream name..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newWorkstream.description}
                  onChange={(e) => setNewWorkstream({ ...newWorkstream, description: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm resize-none"
                  rows={2}
                  placeholder="Enter workstream description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={newWorkstream.priority}
                    onChange={(e) => setNewWorkstream({ ...newWorkstream, priority: e.target.value as 'low' | 'medium' | 'high' })}
                    className="w-full px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    value={newWorkstream.estimatedDuration}
                    onChange={(e) => setNewWorkstream({ ...newWorkstream, estimatedDuration: parseInt(e.target.value) || 60 })}
                    className="w-full px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    min="1"
                    max="480"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Assign Agents
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {availableAgents.map((agent) => (
                    <label key={agent.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newWorkstream.agentIds.includes(agent.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewWorkstream({
                              ...newWorkstream,
                              agentIds: [...newWorkstream.agentIds, agent.id]
                            });
                          } else {
                            setNewWorkstream({
                              ...newWorkstream,
                              agentIds: newWorkstream.agentIds.filter(id => id !== agent.id)
                            });
                          }
                        }}
                        className="rounded border-stone-600 bg-stone-800 text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-xs text-stone-300">{agent.name}</span>
                      <span className="text-xs text-stone-500">({agent.type})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <Button
                  type="button"
                  onClick={handleAddWorkstream}
                  className="flex-1"
                  disabled={!newWorkstream.name.trim()}
                >
                  Add Workstream
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddWorkstream(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Dependencies Section */}
      {workstreams.length > 1 && (
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-stone-400">Dependencies</h4>
          <div className="space-y-2">
            {workstreams.map((fromWorkstream) => (
              workstreams.map((toWorkstream) => {
                if (fromWorkstream.id === toWorkstream.id) return null;
                
                const existingDependency = dependencies.find(
                  dep => dep.from === fromWorkstream.id && dep.to === toWorkstream.id
                );

                return (
                  <div key={`${fromWorkstream.id}-${toWorkstream.id}`} className="flex items-center space-x-2 text-xs">
                    <span className="text-stone-400">{fromWorkstream.name}</span>
                    <span className="text-stone-500">→</span>
                    <span className="text-stone-400">{toWorkstream.name}</span>
                    <div className="flex space-x-1 ml-auto">
                      {existingDependency ? (
                        <>
                          <span className={`px-2 py-1 rounded text-xs ${
                            existingDependency.type === 'blocking' ? 'bg-red-500/20 text-red-400' :
                            existingDependency.type === 'sequential' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {existingDependency.type}
                          </span>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRemoveDependency(fromWorkstream.id, toWorkstream.id)}
                            className="text-xs text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      ) : (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddDependency(fromWorkstream.id, toWorkstream.id, e.target.value as 'blocking' | 'sequential' | 'parallel');
                            }
                          }}
                          className="px-2 py-1 border border-stone-700 bg-stone-800 text-stone-200 rounded text-xs"
                        >
                          <option value="">No dependency</option>
                          <option value="blocking">Blocking</option>
                          <option value="sequential">Sequential</option>
                          <option value="parallel">Parallel</option>
                        </select>
                      )}
                    </div>
                  </div>
                );
              })
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
