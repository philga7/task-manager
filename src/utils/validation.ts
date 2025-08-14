import { Milestone, Task, Goal, Project } from '../types';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validates milestone-task association
 */
export function validateMilestoneTaskAssociation(
  milestone: Milestone, 
  task: Task, 
  allTasks: Task[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Check if task exists
  if (!task) {
    errors.push({
      field: 'taskId',
      message: 'Task does not exist',
      severity: 'error'
    });
    return { isValid: false, errors, warnings };
  }

  // Check if milestone has projectId and task belongs to different project
  if (milestone.projectId && task.projectId && milestone.projectId !== task.projectId) {
    errors.push({
      field: 'projectId',
      message: `Task "${task.title}" belongs to a different project than milestone "${milestone.title}"`,
      severity: 'error'
    });
  }

  // Check if task is already completed and milestone is not
  if (task.status === 'completed' && !milestone.completed) {
    warnings.push({
      field: 'status',
      message: `Task "${task.title}" is completed but milestone "${milestone.title}" is not marked as completed`,
      severity: 'warning'
    });
  }

  // Check if task is already associated with another milestone in the same goal
  const taskAssociatedWithOtherMilestone = allTasks.some(t => 
    t.id === task.id && 
    t.projectId === task.projectId &&
    t.status === 'completed'
  );

  if (taskAssociatedWithOtherMilestone) {
    warnings.push({
      field: 'taskAssociation',
      message: `Task "${task.title}" may already be associated with another milestone`,
      severity: 'warning'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates milestone-task consistency to ensure milestone completion status matches task completion
 */
export function validateMilestoneTaskConsistency(milestone: Milestone, tasks: Task[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Skip validation for manual milestones (no associated tasks)
  if (!milestone.taskIds || milestone.taskIds.length === 0) {
    return { isValid: true, errors, warnings };
  }

  // Find all associated tasks
  const associatedTasks = tasks.filter(task => milestone.taskIds!.includes(task.id));
  
  // If no associated tasks found, this might indicate a data inconsistency
  if (associatedTasks.length === 0) {
    warnings.push({
      field: 'taskIds',
      message: `Milestone "${milestone.title}" has task IDs but no associated tasks found`,
      severity: 'warning'
    });
    return { isValid: true, errors, warnings };
  }

  // Check if all associated tasks are completed
  const allTasksCompleted = associatedTasks.every(task => task.status === 'completed');
  
  // Check for inconsistency: all tasks completed but milestone not marked as completed
  if (allTasksCompleted && !milestone.completed) {
    errors.push({
      field: 'completion',
      message: `Milestone "${milestone.title}" should be completed when all associated tasks are done`,
      severity: 'error'
    });
  }
  
  // Check for inconsistency: not all tasks completed but milestone marked as completed
  if (!allTasksCompleted && milestone.completed) {
    errors.push({
      field: 'completion',
      message: `Milestone "${milestone.title}" should not be completed when associated tasks are incomplete`,
      severity: 'error'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates milestone data structure
 */
export function validateMilestoneData(milestone: Milestone): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Check title
  if (!milestone.title || milestone.title.trim().length === 0) {
    errors.push({
      field: 'title',
      message: 'Milestone title is required',
      severity: 'error'
    });
  } else if (milestone.title.trim().length < 3) {
    warnings.push({
      field: 'title',
      message: 'Milestone title should be at least 3 characters long',
      severity: 'warning'
    });
  }

  // Check if milestone is completed but has no completedAt date
  if (milestone.completed && !milestone.completedAt) {
    warnings.push({
      field: 'completedAt',
      message: 'Completed milestone should have a completion date',
      severity: 'warning'
    });
  }

  // Check if milestone has completedAt but is not marked as completed
  if (!milestone.completed && milestone.completedAt) {
    errors.push({
      field: 'completed',
      message: 'Milestone has completion date but is not marked as completed',
      severity: 'error'
    });
  }

  // Check taskIds array
  if (milestone.taskIds && !Array.isArray(milestone.taskIds)) {
    errors.push({
      field: 'taskIds',
      message: 'Task IDs must be an array',
      severity: 'error'
    });
  }

  // Check for duplicate task IDs
  if (milestone.taskIds && Array.isArray(milestone.taskIds)) {
    const uniqueTaskIds = new Set(milestone.taskIds);
    if (uniqueTaskIds.size !== milestone.taskIds.length) {
      errors.push({
        field: 'taskIds',
        message: 'Duplicate task IDs found in milestone',
        severity: 'error'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Checks for circular dependencies in milestone-task associations
 */
export function checkCircularDependencies(
  milestones: Milestone[], 
  tasks: Task[],
  projects: Project[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Create a map of task dependencies
  const taskDependencies = new Map<string, string[]>();
  
  // Build dependency graph
  tasks.forEach(task => {
    if (task.projectId) {
      const project = projects.find(p => p.id === task.projectId);
      if (project) {
        const milestone = milestones.find(m => 
          m.projectId === project.goalId && 
          m.taskIds?.includes(task.id)
        );
        if (milestone) {
          taskDependencies.set(task.id, milestone.taskIds || []);
        }
      }
    }
  });

  // Check for circular dependencies using DFS
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(taskId: string): boolean {
    if (recursionStack.has(taskId)) {
      return true;
    }
    if (visited.has(taskId)) {
      return false;
    }

    visited.add(taskId);
    recursionStack.add(taskId);

    const dependencies = taskDependencies.get(taskId) || [];
    for (const depId of dependencies) {
      if (hasCycle(depId)) {
        return true;
      }
    }

    recursionStack.delete(taskId);
    return false;
  }

  // Check each task for cycles
  for (const task of tasks) {
    if (!visited.has(task.id) && hasCycle(task.id)) {
      errors.push({
        field: 'circularDependency',
        message: `Circular dependency detected involving task "${task.title}"`,
        severity: 'error'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates goal data including all milestones
 */
export function validateGoalData(goal: Goal, allTasks: Task[], allProjects: Project[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate goal basic data
  if (!goal.title || goal.title.trim().length === 0) {
    errors.push({
      field: 'title',
      message: 'Goal title is required',
      severity: 'error'
    });
  }

  if (!goal.targetDate) {
    errors.push({
      field: 'targetDate',
      message: 'Target date is required',
      severity: 'error'
    });
  } else if (goal.targetDate < new Date()) {
    warnings.push({
      field: 'targetDate',
      message: 'Target date is in the past',
      severity: 'warning'
    });
  }

  if (goal.progress < 0 || goal.progress > 100) {
    errors.push({
      field: 'progress',
      message: 'Progress must be between 0 and 100',
      severity: 'error'
    });
  }

  // Validate all milestones
  goal.milestones.forEach((milestone, index) => {
    const milestoneValidation = validateMilestoneData(milestone);
    milestoneValidation.errors.forEach(error => {
      errors.push({
        field: `milestone[${index}].${error.field}`,
        message: error.message,
        severity: error.severity
      });
    });
    milestoneValidation.warnings.forEach(warning => {
      warnings.push({
        field: `milestone[${index}].${warning.field}`,
        message: warning.message,
        severity: warning.severity
      });
    });

    // Validate milestone-task associations
    if (milestone.taskIds) {
      milestone.taskIds.forEach(taskId => {
        const task = allTasks.find(t => t.id === taskId);
        if (!task) {
          errors.push({
            field: `milestone[${index}].taskIds`,
            message: `Task with ID "${taskId}" not found`,
            severity: 'error'
          });
        } else {
          const associationValidation = validateMilestoneTaskAssociation(
            milestone, 
            task, 
            allTasks
          );
          associationValidation.errors.forEach(error => {
            errors.push({
              field: `milestone[${index}].${error.field}`,
              message: error.message,
              severity: error.severity
            });
          });
        }
      });
    }

    // Validate milestone-task consistency
    const consistencyValidation = validateMilestoneTaskConsistency(milestone, allTasks);
    consistencyValidation.errors.forEach(error => {
      errors.push({
        field: `milestone[${index}].${error.field}`,
        message: error.message,
        severity: error.severity
      });
    });
    consistencyValidation.warnings.forEach(warning => {
      warnings.push({
        field: `milestone[${index}].${warning.field}`,
        message: warning.message,
        severity: warning.severity
      });
    });
  });

  // Check for circular dependencies
  const circularValidation = checkCircularDependencies(goal.milestones, allTasks, allProjects);
  errors.push(...circularValidation.errors);
  warnings.push(...circularValidation.warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates task data
 */
export function validateTaskData(task: Task): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!task.title || task.title.trim().length === 0) {
    errors.push({
      field: 'title',
      message: 'Task title is required',
      severity: 'error'
    });
  }

  if (task.dueDate && task.dueDate < new Date()) {
    warnings.push({
      field: 'dueDate',
      message: 'Due date is in the past',
      severity: 'warning'
    });
  }

  if (task.status === 'completed' && !task.completedAt) {
    warnings.push({
      field: 'completedAt',
      message: 'Completed task should have a completion date',
      severity: 'warning'
    });
  }

  if (!task.priority || !['low', 'medium', 'high'].includes(task.priority)) {
    errors.push({
      field: 'priority',
      message: 'Priority must be low, medium, or high',
      severity: 'error'
    });
  }

  if (!task.status || !['todo', 'in-progress', 'completed'].includes(task.status)) {
    errors.push({
      field: 'status',
      message: 'Status must be todo, in-progress, or completed',
      severity: 'error'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Formats validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string[] {
  return errors.map(error => `${error.field}: ${error.message}`);
}

/**
 * Formats validation warnings for display
 */
export function formatValidationWarnings(warnings: ValidationError[]): string[] {
  return warnings.map(warning => `${warning.field}: ${warning.message}`);
}
