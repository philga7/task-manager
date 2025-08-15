import { Task, Project, Goal, Milestone, UserSettings, User, AuthenticationState } from '../types';
import { calculateProjectProgress, calculateGoalProgress } from '../utils/progress';
import { validateTaskData, validateGoalData, validateMilestoneTaskAssociation, validateMilestoneTaskConsistency } from '../utils/validation';

interface AppState {
  tasks: Task[];
  projects: Project[];
  goals: Goal[];
  analytics: {
    tasksCompleted: number;
    tasksCreated: number;
    productivity: number;
    streakDays: number;
    averageCompletionTime: number;
  };
  searchQuery: string;
  selectedProject: string | null;
  selectedPriority: string | null;
  userSettings: UserSettings;
  authentication: AuthenticationState;
}

type AppAction =
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: Goal }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'UPDATE_MILESTONE'; payload: { goalId: string; milestoneId: string; updates: Partial<Milestone> } }
  | { type: 'LINK_TASK_TO_MILESTONE'; payload: { goalId: string; milestoneId: string; taskId: string } }
  | { type: 'UNLINK_TASK_FROM_MILESTONE'; payload: { goalId: string; milestoneId: string; taskId: string } }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_PROJECT'; payload: string | null }
  | { type: 'SET_SELECTED_PRIORITY'; payload: string | null }
  | { type: 'UPDATE_USER_PROFILE'; payload: { name: string; email: string } }
  | { type: 'UPDATE_NOTIFICATION_SETTINGS'; payload: { emailTasks: boolean; dailySummary: boolean; weeklyReports: boolean } }
  | { type: 'UPDATE_APPEARANCE_SETTINGS'; payload: { theme: string; accentColor: string } }
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SWITCH_TO_DEMO' }
  | { type: 'SWITCH_TO_AUTH' }
  | { type: 'LOAD_USER_DATA'; payload: AppState };

// Helper function to update project progress based on tasks
function updateProjectProgress(projects: Project[], tasks: Task[]): Project[] {
  return projects.map(project => {
    const projectTasks = tasks.filter(task => task.projectId === project.id);
    const progressResult = calculateProjectProgress(projectTasks);
    
    return {
      ...project,
      progress: progressResult.percentage,
      tasks: projectTasks
    };
  });
}

// Helper function to update goal progress based on projects
function updateGoalProgress(goals: Goal[], projects: Project[]): Goal[] {
  return goals.map(goal => {
    const goalProjects = projects.filter(project => project.goalId === goal.id);
    const progressResult = calculateGoalProgress(goalProjects);
    
    return {
      ...goal,
      progress: progressResult.percentage,
      projects: goalProjects
    };
  });
}

// Helper function to update milestone completion based on task completion
function updateMilestoneCompletion(goals: Goal[], tasks: Task[]): Goal[] {
  return goals.map(goal => ({
    ...goal,
    milestones: goal.milestones.map(milestone => {
      if (milestone.taskIds && milestone.taskIds.length > 0) {
        // Task-linked milestone: always reflect task completion status
        const associatedTasks = tasks.filter(task => milestone.taskIds!.includes(task.id));
        
        if (associatedTasks.length === 0) {
          // No associated tasks found, keep current completion status
          console.log(`Milestone ${milestone.id} has taskIds but no tasks found, keeping current status`);
          return milestone;
        }
        
        const allTasksCompleted = associatedTasks.every(task => task.status === 'completed');
        const wasCompleted = milestone.completed;
        
        // Always update completion status based on task completion
        const updatedMilestone = {
          ...milestone,
          completed: allTasksCompleted,
          completedAt: allTasksCompleted ? new Date() : undefined,
          completionType: allTasksCompleted ? 'auto' as const : 'manual' as const
        };
        
        // Log milestone completion changes for debugging
        if (wasCompleted !== allTasksCompleted) {
          console.log(`Milestone ${milestone.id} (${milestone.title}) ${allTasksCompleted ? 'completed' : 'uncompleted'} based on task status`);
        }
        
        return updatedMilestone;
      } else {
        // Manual milestone: keep existing completion status (no task association)
        return {
          ...milestone,
          completionType: milestone.completed ? 'manual' as const : undefined
        };
      }
    })
  }));
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_TASK': {
      // Validate task data before adding
      const taskValidation = validateTaskData(action.payload);
      if (!taskValidation.isValid) {
        console.error('Task validation failed:', taskValidation.errors);
        // Still add the task but log the validation errors
        // In a real app, you might want to throw an error or handle this differently
      }
      
      const updatedTasks = [...state.tasks, action.payload];
      const updatedProjects = updateProjectProgress(state.projects, updatedTasks);
      const updatedGoals = updateMilestoneCompletion(updateGoalProgress(state.goals, updatedProjects), updatedTasks);
      
      return { 
        ...state, 
        tasks: updatedTasks,
        projects: updatedProjects,
        goals: updatedGoals
      };
    }
    case 'UPDATE_TASK': {
      // Validate task data before updating
      const taskValidation = validateTaskData(action.payload);
      if (!taskValidation.isValid) {
        console.error('Task validation failed:', taskValidation.errors);
        // Still update the task but log the validation errors
      }
      
      const updatedTasks = state.tasks.map(task => 
        task.id === action.payload.id ? action.payload : task
      );
      const updatedProjects = updateProjectProgress(state.projects, updatedTasks);
      const updatedGoals = updateMilestoneCompletion(updateGoalProgress(state.goals, updatedProjects), updatedTasks);
      
      return {
        ...state,
        tasks: updatedTasks,
        projects: updatedProjects,
        goals: updatedGoals
      };
    }
    case 'DELETE_TASK': {
      const updatedTasks = state.tasks.filter(task => task.id !== action.payload);
      const updatedProjects = updateProjectProgress(state.projects, updatedTasks);
      const updatedGoals = updateMilestoneCompletion(updateGoalProgress(state.goals, updatedProjects), updatedTasks);
      
      return {
        ...state,
        tasks: updatedTasks,
        projects: updatedProjects,
        goals: updatedGoals
      };
    }
    case 'ADD_PROJECT': {
      const updatedProjects = [...state.projects, action.payload];
      const updatedGoals = updateGoalProgress(state.goals, updatedProjects);
      
      return { 
        ...state, 
        projects: updatedProjects,
        goals: updatedGoals
      };
    }
    case 'UPDATE_PROJECT': {
      const updatedProjects = state.projects.map(project =>
        project.id === action.payload.id ? action.payload : project
      );
      const updatedGoals = updateGoalProgress(state.goals, updatedProjects);
      
      return {
        ...state,
        projects: updatedProjects,
        goals: updatedGoals
      };
    }
    case 'DELETE_PROJECT': {
      const updatedProjects = state.projects.filter(project => project.id !== action.payload);
      const updatedGoals = updateGoalProgress(state.goals, updatedProjects);
      
      return {
        ...state,
        projects: updatedProjects,
        goals: updatedGoals
      };
    }
    case 'ADD_GOAL': {
      // Validate goal data before adding
      const goalValidation = validateGoalData(action.payload, state.tasks, state.projects);
      if (!goalValidation.isValid) {
        console.error('Goal validation failed:', goalValidation.errors);
        // Still add the goal but log the validation errors
      }
      return { ...state, goals: [...state.goals, action.payload] };
    }
    case 'UPDATE_GOAL': {
      // Validate goal data before updating
      const goalValidation = validateGoalData(action.payload, state.tasks, state.projects);
      if (!goalValidation.isValid) {
        console.error('Goal validation failed:', goalValidation.errors);
        // Still update the goal but log the validation errors
      }
      return {
        ...state,
        goals: state.goals.map(goal =>
          goal.id === action.payload.id ? action.payload : goal
        )
      };
    }
    case 'DELETE_GOAL':
      return {
        ...state,
        goals: state.goals.filter(goal => goal.id !== action.payload)
      };
    case 'UPDATE_MILESTONE': {
      const { goalId, milestoneId, updates } = action.payload;
      
      // Find the milestone to check if it has associated tasks
      const goal = state.goals.find(g => g.id === goalId);
      const milestone = goal?.milestones.find(m => m.id === milestoneId);
      
      // Prevent manual completion of task-linked milestones
      if (milestone && milestone.taskIds && milestone.taskIds.length > 0 && updates.completed !== undefined) {
        console.log(`Preventing manual completion update for task-linked milestone ${milestoneId}`);
        // Remove completion-related updates for task-linked milestones
        const otherUpdates = { ...updates };
        delete otherUpdates.completed;
        delete otherUpdates.completedAt;
        return {
          ...state,
          goals: state.goals.map(goal =>
            goal.id === goalId
              ? {
                  ...goal,
                  milestones: goal.milestones.map(milestone =>
                    milestone.id === milestoneId
                      ? { ...milestone, ...otherUpdates }
                      : milestone
                  )
                }
              : goal
          )
        };
      }
      
      // Allow updates for manual milestones or non-completion updates
      const updatedGoals = state.goals.map(goal =>
        goal.id === goalId
          ? {
              ...goal,
              milestones: goal.milestones.map(milestone =>
                milestone.id === milestoneId
                  ? { 
                      ...milestone, 
                      ...updates,
                      // Set completionType for manual completion updates
                      completionType: updates.completed !== undefined 
                        ? (updates.completed ? 'manual' as const : undefined)
                        : milestone.completionType
                    }
                  : milestone
              )
            }
          : goal
      );
      
      // Validate milestone-task consistency after update
      if (milestone) {
        const updatedMilestone = updatedGoals
          .find(g => g.id === goalId)
          ?.milestones.find(m => m.id === milestoneId);
        
        if (updatedMilestone) {
          const consistencyValidation = validateMilestoneTaskConsistency(updatedMilestone, state.tasks);
          if (!consistencyValidation.isValid) {
            console.error('Milestone-task consistency validation failed:', consistencyValidation.errors);
            // Log validation errors but still allow the update
            // In a production app, you might want to prevent the update or show user feedback
          }
          if (consistencyValidation.warnings.length > 0) {
            console.warn('Milestone-task consistency warnings:', consistencyValidation.warnings);
          }
        }
      }
      
      return {
        ...state,
        goals: updatedGoals
      };
    }
    case 'LINK_TASK_TO_MILESTONE': {
      const { goalId, milestoneId, taskId } = action.payload;
      
      // Find the goal and milestone
      const goal = state.goals.find(g => g.id === goalId);
      const milestone = goal?.milestones.find(m => m.id === milestoneId);
      const task = state.tasks.find(t => t.id === taskId);
      
      // Validate the association if all entities exist
      if (goal && milestone && task) {
        const validation = validateMilestoneTaskAssociation(milestone, task, state.tasks);
        if (!validation.isValid) {
          console.error('Milestone-task association validation failed:', validation.errors);
          // Still proceed but log the validation errors
        }
      }
      
      const updatedGoals = state.goals.map(goal =>
        goal.id === goalId
          ? {
              ...goal,
              milestones: goal.milestones.map(milestone =>
                milestone.id === milestoneId
                  ? {
                      ...milestone,
                      taskIds: [...(milestone.taskIds || []), taskId]
                    }
                  : milestone
              )
            }
          : goal
      );
      
      // Validate milestone-task consistency after linking
      if (goal && milestone) {
        const updatedMilestone = updatedGoals
          .find(g => g.id === goalId)
          ?.milestones.find(m => m.id === milestoneId);
        
        if (updatedMilestone) {
          const consistencyValidation = validateMilestoneTaskConsistency(updatedMilestone, state.tasks);
          if (!consistencyValidation.isValid) {
            console.error('Milestone-task consistency validation failed after linking:', consistencyValidation.errors);
          }
          if (consistencyValidation.warnings.length > 0) {
            console.warn('Milestone-task consistency warnings after linking:', consistencyValidation.warnings);
          }
        }
      }
      
      return {
        ...state,
        goals: updatedGoals
      };
    }
    case 'UNLINK_TASK_FROM_MILESTONE': {
      const { goalId, milestoneId, taskId } = action.payload;
      return {
        ...state,
        goals: state.goals.map(goal =>
          goal.id === goalId
            ? {
                ...goal,
                milestones: goal.milestones.map(milestone =>
                  milestone.id === milestoneId
                    ? {
                        ...milestone,
                        taskIds: (milestone.taskIds || []).filter(id => id !== taskId)
                      }
                    : milestone
                )
              }
            : goal
        )
      };
    }
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_SELECTED_PROJECT':
      return { ...state, selectedProject: action.payload };
    case 'SET_SELECTED_PRIORITY':
      return { ...state, selectedPriority: action.payload };
    case 'UPDATE_USER_PROFILE':
      return {
        ...state,
        userSettings: {
          ...state.userSettings,
          profile: {
            ...state.userSettings.profile,
            ...action.payload
          }
        }
      };
    case 'UPDATE_NOTIFICATION_SETTINGS':
      return {
        ...state,
        userSettings: {
          ...state.userSettings,
          notifications: {
            ...state.userSettings.notifications,
            ...action.payload
          }
        }
      };
    case 'UPDATE_APPEARANCE_SETTINGS':
      return {
        ...state,
        userSettings: {
          ...state.userSettings,
          appearance: {
            ...state.userSettings.appearance,
            theme: action.payload.theme as 'light' | 'dark' | 'system',
            accentColor: action.payload.accentColor
          }
        }
      };
    case 'LOGIN':
      return {
        ...state,
        authentication: {
          ...state.authentication,
          isAuthenticated: true,
          user: action.payload
        }
      };
    case 'LOGOUT':
      return {
        ...state,
        authentication: {
          ...state.authentication,
          isAuthenticated: false,
          user: null
        }
      };
    case 'SWITCH_TO_DEMO':
      return {
        ...state,
        authentication: {
          ...state.authentication,
          isAuthenticated: true,
          isDemoMode: true,
          user: {
            id: 'demo-user-id',
            name: 'Demo User',
            email: 'demo@example.com',
            createdAt: new Date()
          }
        }
      };
    case 'SWITCH_TO_AUTH':
      return {
        ...state,
        authentication: {
          ...state.authentication,
          isAuthenticated: false,
          isDemoMode: false,
          user: null
        }
      };
    case 'LOAD_USER_DATA':
      return {
        ...action.payload,
        authentication: state.authentication // Preserve current authentication state
      };
    default:
      return state;
  }
}

export type { AppState, AppAction };
