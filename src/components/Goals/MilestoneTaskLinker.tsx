import React, { useState, useEffect } from 'react';
import { Milestone, Task } from '../../types';
import { Button } from '../UI/Button';
import { ValidationErrors } from '../UI/ValidationErrors';
import { 
  validateMilestoneTaskAssociation,
  validateMilestoneData,
  ValidationResult
} from '../../utils/validation';
import { 
  Link, 
  Unlink, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Flag,
  Calendar,
  Folder,
  Zap,
  Hand
} from 'lucide-react';
import { format } from 'date-fns';

interface MilestoneTaskLinkerProps {
  milestone: Milestone;
  availableTasks: Task[];
  onUpdate: (milestone: Milestone) => void;
}

export function MilestoneTaskLinker({ milestone, availableTasks, onUpdate }: MilestoneTaskLinkerProps) {
  const [showAvailableTasks, setShowAvailableTasks] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: true, errors: [], warnings: [] });
  const [showValidation, setShowValidation] = useState(false);

  // Filter available tasks based on milestone project association
  const filteredAvailableTasks = availableTasks.filter(task => {
    // If milestone has a projectId, only show tasks from that project
    if (milestone.projectId && task.projectId !== milestone.projectId) {
      return false;
    }
    // Exclude tasks that are already associated with this milestone
    if (milestone.taskIds && milestone.taskIds.includes(task.id)) {
      return false;
    }
    return true;
  });

  // Get associated tasks
  const associatedTasks = availableTasks.filter(task => 
    milestone.taskIds && milestone.taskIds.includes(task.id)
  );

  // Validate milestone data when it changes
  useEffect(() => {
    const validation = validateMilestoneData(milestone);
    setValidationResult(validation);
    setShowValidation(validation.errors.length > 0 || validation.warnings.length > 0);
  }, [milestone]);

  const handleLinkTask = (taskId: string) => {
    const task = availableTasks.find(t => t.id === taskId);
    if (!task) {
      setValidationResult({
        isValid: false,
        errors: [{ field: 'taskId', message: 'Task not found', severity: 'error' }],
        warnings: []
      });
      setShowValidation(true);
      return;
    }

    // Validate the association before linking
    const associationValidation = validateMilestoneTaskAssociation(
      milestone, 
      task, 
      availableTasks
    );

    if (!associationValidation.isValid) {
      setValidationResult(associationValidation);
      setShowValidation(true);
      return;
    }

    // If there are only warnings, show them but still proceed
    if (associationValidation.warnings.length > 0) {
      setValidationResult(associationValidation);
      setShowValidation(true);
    }

    const updatedMilestone: Milestone = {
      ...milestone,
      taskIds: [...(milestone.taskIds || []), taskId]
    };
    onUpdate(updatedMilestone);
  };

  const handleUnlinkTask = (taskId: string) => {
    const updatedMilestone: Milestone = {
      ...milestone,
      taskIds: (milestone.taskIds || []).filter(id => id !== taskId)
    };
    onUpdate(updatedMilestone);
  };

  const getTaskStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <Circle className="w-4 h-4 text-stone-400" />;
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-amber-500';
      default:
        return 'text-stone-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Validation Errors and Warnings */}
      {showValidation && (
        <ValidationErrors
          errors={validationResult.errors}
          warnings={validationResult.warnings}
          onDismiss={() => setShowValidation(false)}
        />
      )}

      {/* Milestone Completion Type Indicator */}
      <div className="flex items-center justify-between p-3 bg-stone-800/30 border border-stone-700 rounded-lg">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-stone-200">Milestone Type:</span>
          
          {/* Auto-completed indicator */}
          {milestone.completionType === 'auto' && (
            <div className="flex items-center space-x-1 text-xs text-blue-400 bg-blue-900/20 px-2 py-1 rounded-full">
              <Zap className="w-3 h-3" />
              <span>Auto-completed (Task-linked)</span>
            </div>
          )}
          
          {/* Manual completion indicator */}
          {milestone.completionType === 'manual' && (
            <div className="flex items-center space-x-1 text-xs text-purple-400 bg-purple-900/20 px-2 py-1 rounded-full">
              <Hand className="w-3 h-3" />
              <span>Manual completion</span>
            </div>
          )}
          
          {/* No completion type (new milestone) */}
          {!milestone.completionType && (
            <div className="flex items-center space-x-1 text-xs text-stone-400 bg-stone-700/20 px-2 py-1 rounded-full">
              <Circle className="w-3 h-3" />
              <span>Not completed</span>
            </div>
          )}
        </div>
        
        {/* Task association status */}
        {associatedTasks.length > 0 && (
          <div className="flex items-center space-x-1 text-xs text-stone-400">
            <Link className="w-3 h-3" />
            <span>{associatedTasks.length} task{associatedTasks.length !== 1 ? 's' : ''} linked</span>
          </div>
        )}
      </div>

      {/* Associated Tasks Section */}
      {associatedTasks.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm md:text-base font-medium text-stone-100 flex items-center">
            <Link className="w-4 h-4 mr-2" />
            Associated Tasks ({associatedTasks.length})
          </h4>
          <div className="space-y-2">
            {associatedTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-stone-800 rounded-lg border border-stone-700">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getTaskStatusIcon(task.status)}
                  <div className="flex-1 min-w-0">
                    <h5 className={`text-sm md:text-base font-medium text-stone-100 truncate ${task.status === 'completed' ? 'line-through' : ''}`}>
                      {task.title}
                    </h5>
                    {task.description && (
                      <p className="text-xs text-stone-400 truncate">{task.description}</p>
                    )}
                    <div className="flex items-center space-x-2 mt-1">
                      <Flag className={`w-3 h-3 ${getPriorityColor(task.priority)}`} />
                      <span className="text-xs text-stone-500 capitalize">{task.priority}</span>
                      {task.dueDate && (
                        <>
                          <Calendar className="w-3 h-3 text-stone-400" />
                          <span className="text-xs text-stone-400">
                            {format(task.dueDate, 'MMM d')}
                          </span>
                        </>
                      )}
                      {task.projectId && (
                        <>
                          <Folder className="w-3 h-3 text-stone-400" />
                          <span className="text-xs text-stone-400">Project</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnlinkTask(task.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  <Unlink className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Tasks Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm md:text-base font-medium text-stone-100 flex items-center">
            <Link className="w-4 h-4 mr-2" />
            Available Tasks ({filteredAvailableTasks.length})
          </h4>
          {filteredAvailableTasks.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAvailableTasks(!showAvailableTasks)}
            >
              {showAvailableTasks ? 'Hide' : 'Show'} Tasks
            </Button>
          )}
        </div>

        {showAvailableTasks && filteredAvailableTasks.length > 0 && (
          <div className="space-y-2">
            {filteredAvailableTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-stone-800 rounded-lg border border-stone-700">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getTaskStatusIcon(task.status)}
                  <div className="flex-1 min-w-0">
                    <h5 className={`text-sm md:text-base font-medium text-stone-100 truncate ${task.status === 'completed' ? 'line-through' : ''}`}>
                      {task.title}
                    </h5>
                    {task.description && (
                      <p className="text-xs text-stone-400 truncate">{task.description}</p>
                    )}
                    <div className="flex items-center space-x-2 mt-1">
                      <Flag className={`w-3 h-3 ${getPriorityColor(task.priority)}`} />
                      <span className="text-xs text-stone-500 capitalize">{task.priority}</span>
                      {task.dueDate && (
                        <>
                          <Calendar className="w-3 h-3 text-stone-400" />
                          <span className="text-xs text-stone-400">
                            {format(task.dueDate, 'MMM d')}
                          </span>
                        </>
                      )}
                      {task.projectId && (
                        <>
                          <Folder className="w-3 h-3 text-stone-400" />
                          <span className="text-xs text-stone-400">Project</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLinkTask(task.id)}
                  className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
                >
                  <Link className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {filteredAvailableTasks.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-stone-400">
              {milestone.projectId 
                ? 'No available tasks in this project to link.'
                : 'No available tasks to link.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
