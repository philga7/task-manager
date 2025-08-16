import { Task, Project, Goal, Milestone, ProgressCalculation, TaskProgress, ProjectProgress, GoalProgress } from '../types';

/**
 * Calculate progress for a single task
 */
export function calculateTaskProgress(task: Task): TaskProgress {
  const isCompleted = task.status === 'completed';
  return {
    taskId: task.id,
    status: task.status,
    total: 1,
    completed: isCompleted ? 1 : 0,
    percentage: isCompleted ? 100 : 0
  };
}

/**
 * Calculate progress for a project based on its tasks
 */
export function calculateProjectProgress(tasks: Task[]): ProjectProgress {
  if (tasks.length === 0) {
    return {
      projectId: '',
      total: 0,
      completed: 0,
      percentage: 0,
      taskProgress: []
    };
  }

  const taskProgress = tasks.map(calculateTaskProgress);
  const completedTasks = taskProgress.filter(tp => tp.completed > 0).length;
  const percentage = (completedTasks / tasks.length) * 100;

  return {
    projectId: '',
    total: tasks.length,
    completed: completedTasks,
    percentage: Math.round(percentage),
    taskProgress
  };
}

/**
 * Calculate progress for a project with project ID
 */
export function calculateProjectProgressWithId(projectId: string, tasks: Task[]): ProjectProgress {
  const progress = calculateProjectProgress(tasks);
  return {
    ...progress,
    projectId
  };
}

/**
 * Calculate progress for a goal based on its projects
 */
export function calculateGoalProgress(projects: Project[]): GoalProgress {
  if (projects.length === 0) {
    return {
      total: 0,
      completed: 0,
      percentage: 0,
      projectProgress: []
    };
  }

  const projectProgress = projects.map(project => 
    calculateProjectProgressWithId(project.id, project.tasks)
  );

  const totalProjects = projects.length;
  const completedProjects = projectProgress.filter(pp => pp.percentage === 100).length;
  const averageProgress = projectProgress.reduce((sum, pp) => sum + pp.percentage, 0) / totalProjects;

  return {
    total: totalProjects,
    completed: completedProjects,
    percentage: Math.round(averageProgress),
    projectProgress
  };
}

/**
 * Calculate weighted progress for a goal (projects can have different weights)
 */
export function calculateWeightedGoalProgress(projects: Project[], weights?: Record<string, number>): GoalProgress {
  if (projects.length === 0) {
    return {
      total: 0,
      completed: 0,
      percentage: 0,
      projectProgress: []
    };
  }

  const projectProgress = projects.map(project => 
    calculateProjectProgressWithId(project.id, project.tasks)
  );

  let totalWeight = 0;
  let weightedSum = 0;

  projectProgress.forEach((pp) => {
    const weight = weights?.[pp.projectId] || 1;
    totalWeight += weight;
    weightedSum += pp.percentage * weight;
  });

  const weightedPercentage = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const completedProjects = projectProgress.filter(pp => pp.percentage === 100).length;

  return {
    total: projects.length,
    completed: completedProjects,
    percentage: Math.round(weightedPercentage),
    projectProgress
  };
}

/**
 * Calculate overall progress for multiple goals
 */
export function calculateOverallProgress(goals: Goal[]): ProgressCalculation {
  if (goals.length === 0) {
    return {
      total: 0,
      completed: 0,
      percentage: 0
    };
  }

  const goalProgresses = goals.map(goal => calculateGoalProgress(goal.projects));
  const totalGoals = goals.length;
  const averageProgress = goalProgresses.reduce((sum, gp) => sum + gp.percentage, 0) / totalGoals;

  return {
    total: totalGoals,
    completed: goalProgresses.filter(gp => gp.percentage === 100).length,
    percentage: Math.round(averageProgress)
  };
}

/**
 * Get progress summary for a project
 */
export function getProjectProgressSummary(project: Project): {
  totalTasks: number;
  completedTasks: number;
  percentage: number;
  inProgressTasks: number;
  pendingTasks: number;
} {
  const tasks = project.tasks;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
  const pendingTasks = tasks.filter(task => task.status === 'todo').length;
  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalTasks,
    completedTasks,
    percentage,
    inProgressTasks,
    pendingTasks
  };
}

/**
 * Get progress summary for a goal
 */
export function getGoalProgressSummary(goal: Goal): {
  totalProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  percentage: number;
} {
  const projects = goal.projects;
  const totalProjects = projects.length;
  const completedProjects = projects.filter(project => {
    const summary = getProjectProgressSummary(project);
    return summary.percentage === 100;
  }).length;

  const totalTasks = projects.reduce((sum, project) => sum + project.tasks.length, 0);
  const completedTasks = projects.reduce((sum, project) => 
    sum + project.tasks.filter(task => task.status === 'completed').length, 0
  );

  const percentage = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

  return {
    totalProjects,
    completedProjects,
    totalTasks,
    completedTasks,
    percentage
  };
}

/**
 * Helper function to determine if milestone is task-linked or manual
 */
function isTaskLinkedMilestone(milestone: Milestone): boolean {
  return !!(milestone.taskIds && milestone.taskIds.length > 0);
}

/**
 * Calculate progress for a milestone based on associated task completion
 */
export function calculateMilestoneProgress(milestone: Milestone, tasks: Task[]): number {
  if (isTaskLinkedMilestone(milestone)) {
    // Task-linked milestone: calculate from task completion
    const associatedTasks = tasks.filter(task => milestone.taskIds!.includes(task.id));
    if (associatedTasks.length === 0) return 0;
    
    const completedTasks = associatedTasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / associatedTasks.length) * 100);
  } else {
    // Manual milestone: use manual completion status
    return milestone.completed ? 100 : 0;
  }
}

/**
 * Calculate real-time analytics from actual task data
 */
export function calculateRealTimeAnalytics(tasks: Task[]): {
  tasksCompleted: number;
  tasksCreated: number;
  productivity: number;
  streakDays: number;
  averageCompletionTime: number;
} {
  if (tasks.length === 0) {
    return {
      tasksCompleted: 0,
      tasksCreated: 0,
      productivity: 0,
      streakDays: 0,
      averageCompletionTime: 0
    };
  }

  // Calculate basic metrics
  const tasksCompleted = tasks.filter(task => task.status === 'completed').length;
  const tasksCreated = tasks.length;
  
  // Calculate productivity score (completion rate)
  const productivity = tasksCreated > 0 ? Math.round((tasksCompleted / tasksCreated) * 100) : 0;
  
  // Calculate average completion time
  const completedTasks = tasks.filter(task => task.status === 'completed' && task.completedAt);
  let averageCompletionTime = 0;
  
  if (completedTasks.length > 0) {
    const totalDays = completedTasks.reduce((sum, task) => {
      if (task.completedAt && task.createdAt) {
        const days = Math.ceil((task.completedAt.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        return sum + Math.max(1, days); // Minimum 1 day
      }
      return sum;
    }, 0);
    averageCompletionTime = Math.round((totalDays / completedTasks.length) * 10) / 10; // Round to 1 decimal
  }
  
  // Calculate streak days (consecutive days with completed tasks)
  const completedTasksWithDates = completedTasks
    .filter(task => task.completedAt)
    .map(task => ({
      ...task,
      completedDate: task.completedAt!.toDateString()
    }))
    .sort((a, b) => new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime());
  
  let streakDays = 0;
  if (completedTasksWithDates.length > 0) {
    const uniqueDates = [...new Set(completedTasksWithDates.map(task => task.completedDate))];
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    // Check if there are completed tasks today or yesterday
    const hasRecentActivity = uniqueDates.includes(today) || uniqueDates.includes(yesterday);
    
    if (hasRecentActivity) {
      // Calculate consecutive days
      let currentStreak = 0;
      const currentDate = new Date();
      
      for (let i = 0; i < 30; i++) { // Check last 30 days
        const dateString = currentDate.toDateString();
        if (uniqueDates.includes(dateString)) {
          currentStreak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }
      streakDays = currentStreak;
    }
  }
  
  return {
    tasksCompleted,
    tasksCreated,
    productivity,
    streakDays,
    averageCompletionTime
  };
}

/**
 * Generate weekly productivity data for charts
 */
export function generateWeeklyProductivityData(tasks: Task[]): { days: string[]; data: number[] } {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const data = [0, 0, 0, 0, 0, 0, 0];
  
  if (tasks.length === 0) {
    return { days, data };
  }
  
  // Get the start of the current week (Monday)
  const now = new Date();
  const startOfWeek = new Date(now);
  const dayOfWeek = now.getDay();
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, Monday = 1
  startOfWeek.setDate(now.getDate() - daysToSubtract);
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Calculate productivity for each day of the week
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startOfWeek);
    currentDate.setDate(startOfWeek.getDate() + i);
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + 1);
    
    // Count tasks completed on this day
    const tasksCompletedOnDay = tasks.filter(task => {
      if (task.status !== 'completed' || !task.completedAt) return false;
      const completedDate = new Date(task.completedAt);
      return completedDate >= currentDate && completedDate < nextDate;
    }).length;
    
    // Count total tasks created on this day
    const tasksCreatedOnDay = tasks.filter(task => {
      const createdDate = new Date(task.createdAt);
      return createdDate >= currentDate && createdDate < nextDate;
    }).length;
    
    // Calculate productivity percentage for this day
    if (tasksCreatedOnDay > 0) {
      data[i] = Math.round((tasksCompletedOnDay / tasksCreatedOnDay) * 100);
    } else if (tasksCompletedOnDay > 0) {
      // If no tasks were created but some were completed, give 100% productivity
      data[i] = 100;
    }
  }
  
  return { days, data };
}
