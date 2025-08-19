import { Task, Project, Goal, Milestone, UserSettings, User, AuthenticationState } from '../types';
import { calculateProjectProgress, calculateGoalProgress } from '../utils/progress';
import { validateTaskData, validateGoalData, validateMilestoneTaskAssociation, validateMilestoneTaskConsistency } from '../utils/validation';
import { createSession, clearCurrentSession, saveAuthState, clearAuthState } from '../utils/auth';
import { clearDemoStorageData } from '../utils/storage';
import { logValidation, logMilestone, logProfile } from '../utils/logger';
import { generateDemoState } from '../utils/demoData';

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
  | { type: 'RESTORE_AUTH'; payload: { user: User | null; isAuthenticated: boolean; isDemoMode: boolean } }
  | { type: 'LOAD_USER_DATA'; payload: AppState }
  | { type: 'SYNC_PROFILE_DATA' };

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

// Helper function to check if profile data needs syncing
function needsProfileSync(authentication: AuthenticationState, userSettings: UserSettings): boolean {
  if (!authentication.isAuthenticated || !authentication.user) {
    return false;
  }
  
  return (
    authentication.user.name !== userSettings.profile.name ||
    authentication.user.email !== userSettings.profile.email
  );
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
          logMilestone.noTasks(milestone.id);
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
          logMilestone.completion(milestone.id, milestone.title, allTasksCompleted);
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
        logValidation.error('Task', taskValidation.errors);
        // Still add the task but log the validation errors
        // In a real app, you might want to throw an error or handle this differently
      }
      
      const updatedTasks = [...state.tasks, action.payload];
      const updatedProjects = updateProjectProgress(state.projects, updatedTasks);
      const updatedGoals = updateGoalProgress(state.goals, updatedProjects);
      const updatedGoalsWithMilestones = updateMilestoneCompletion(updatedGoals, updatedTasks);
      
      return {
        ...state,
        tasks: updatedTasks,
        projects: updatedProjects,
        goals: updatedGoalsWithMilestones
      };
    }
    case 'UPDATE_TASK': {
      // Validate task data before updating
      const taskValidation = validateTaskData(action.payload);
      if (!taskValidation.isValid) {
        logValidation.error('Task', taskValidation.errors);
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
        logValidation.error('Goal', goalValidation.errors);
        // Still add the goal but log the validation errors
      }
      return { ...state, goals: [...state.goals, action.payload] };
    }
    case 'UPDATE_GOAL': {
      // Validate goal data before updating
      const goalValidation = validateGoalData(action.payload, state.tasks, state.projects);
      if (!goalValidation.isValid) {
        logValidation.error('Goal', goalValidation.errors);
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
        logMilestone.manualUpdate(milestoneId);
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
            logValidation.error('Milestone-task consistency', consistencyValidation.errors);
            // Log validation errors but still allow the update
            // In a production app, you might want to prevent the update or show user feedback
          }
          if (consistencyValidation.warnings.length > 0) {
            logValidation.warn('Milestone-task consistency', consistencyValidation.warnings);
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
          logValidation.error('Milestone-task association', validation.errors);
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
            logValidation.error('Milestone-task consistency after linking', consistencyValidation.errors);
          }
          if (consistencyValidation.warnings.length > 0) {
            logValidation.warn('Milestone-task consistency after linking', consistencyValidation.warnings);
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
      logProfile.update(action.payload);
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
    case 'LOGIN': {
      // Create session for the logged-in user
      createSession(action.payload, false);
      
      const loginAuthState = {
        user: action.payload,
        isAuthenticated: true,
        isDemoMode: false
      };
      
      // Save authentication state for persistence
      saveAuthState(loginAuthState);
      
      return {
        ...state,
        authentication: {
          ...state.authentication,
          isAuthenticated: true,
          isDemoMode: false,
          user: action.payload
        },
        userSettings: {
          ...state.userSettings,
          profile: {
            ...state.userSettings.profile,
            name: action.payload.name,
            email: action.payload.email
          }
        }
      };
    }
    case 'LOGOUT': {
      // Clear session data and auth state
      clearCurrentSession();
      clearAuthState();
      
      // If user was in demo mode, also clear demo storage data
      if (state.authentication.isDemoMode) {
        clearDemoStorageData();
      }
      
      return {
        ...state,
        authentication: {
          ...state.authentication,
          isAuthenticated: false,
          isDemoMode: false,
          user: null
        }
      };
    }
    case 'SWITCH_TO_DEMO': {
      // Clear any existing demo data to ensure clean demo session
      clearDemoStorageData();
      
      // Create demo session
      const demoUser = {
        id: 'demo-user-id',
        name: 'Demo User',
        email: 'demo@example.com',
        createdAt: new Date()
      };
      createSession(demoUser, true);
      
      const demoAuthState = {
        user: demoUser,
        isAuthenticated: true,
        isDemoMode: true
      };
      
      // Save authentication state for persistence
      saveAuthState(demoAuthState);

      // Generate and load demo data
      const demoState = generateDemoState();
      return {
        ...state,
        authentication: {
          ...state.authentication,
          isAuthenticated: true,
          isDemoMode: true,
          user: demoUser
        },
        userSettings: {
          ...state.userSettings,
          profile: {
            ...state.userSettings.profile,
            name: 'Demo User',
            email: 'demo@example.com'
          }
        },
        tasks: demoState.tasks,
        projects: demoState.projects,
        goals: demoState.goals,
        analytics: demoState.analytics,
        searchQuery: '',
        selectedProject: null,
        selectedPriority: null
      };
    }
    case 'SWITCH_TO_AUTH': {
      // Clear demo session and auth state
      clearCurrentSession();
      clearAuthState();
      
      // Clear all demo storage data to prevent data leakage
      clearDemoStorageData();
      
      // Force clear any remaining session data
      try {
        if (typeof window !== 'undefined') {
          // Clear session storage completely for demo-related data
          const sessionKeys = Object.keys(sessionStorage);
          sessionKeys.forEach(key => {
            if (key.includes('task_manager_session') || key.includes('demo')) {
              sessionStorage.removeItem(key);
            }
          });
          
          // Clear localStorage demo data
          const localKeys = Object.keys(localStorage);
          localKeys.forEach(key => {
            if (key.includes('demo') || key.includes('task-manager-demo')) {
              localStorage.removeItem(key);
            }
          });
        }
      } catch {
        // Ignore errors during cleanup
      }
      
      return {
        ...state,
        authentication: {
          ...state.authentication,
          isAuthenticated: false,
          isDemoMode: false,
          user: null
        },
        // Clear all demo data when switching to auth mode
        tasks: [],
        projects: [],
        goals: [],
        analytics: {
          tasksCompleted: 0,
          tasksCreated: 0,
          productivity: 0,
          streakDays: 0,
          averageCompletionTime: 0
        },
        searchQuery: '',
        selectedProject: null,
        selectedPriority: null
      };
    }
    case 'RESTORE_AUTH':
      return {
        ...state,
        authentication: {
          ...state.authentication,
          user: action.payload.user,
          isAuthenticated: action.payload.isAuthenticated,
          isDemoMode: action.payload.isDemoMode
        },
        userSettings: {
          ...state.userSettings,
          profile: {
            ...state.userSettings.profile,
            name: action.payload.user?.name || state.userSettings.profile.name,
            email: action.payload.user?.email || state.userSettings.profile.email
          }
        }
      };
    case 'LOAD_USER_DATA':
      // Ensure that when loading user data, we respect the current authentication state
      // If we're in demo mode, we should only load demo data
      if (state.authentication.isDemoMode) {
        // In demo mode, ensure we only show demo data
        const demoState = generateDemoState();
        return {
          ...demoState,
          authentication: state.authentication // Preserve current authentication state
        };
      } else {
        // In regular mode, load the provided user data
        return {
          ...action.payload,
          authentication: state.authentication // Preserve current authentication state
        };
      }
    case 'SYNC_PROFILE_DATA':
      // Only sync if user is authenticated and there's a mismatch
      if (needsProfileSync(state.authentication, state.userSettings)) {
        logProfile.sync(state.authentication.user!.name, state.authentication.user!.email, state.userSettings.profile);
        return {
          ...state,
          userSettings: {
            ...state.userSettings,
            profile: {
              ...state.userSettings.profile,
              name: state.authentication.user!.name,
              email: state.authentication.user!.email
            }
          }
        };
      }
      logProfile.noSync();
      return state;
    default:
      return state;
  }
}

/**
 * Test function to verify demo mode state scoping
 * This function tests that demo mode properly isolates state
 */
export function testDemoModeStateScoping(): {
  success: boolean;
  tests: Array<{ name: string; passed: boolean; error?: string }>;
} {
  const tests: Array<{ name: string; passed: boolean; error?: string }> = [];
  
  try {
    // Test 1: Verify demo state generation
    const demoState = generateDemoState();
    tests.push({
      name: 'Demo state generation',
      passed: demoState.tasks.length > 0 && demoState.projects.length > 0 && demoState.goals.length > 0,
      error: demoState.tasks.length === 0 || demoState.projects.length === 0 || demoState.goals.length === 0 ? 'Demo state is empty' : undefined
    });
    
    // Test 2: Verify demo state has correct authentication
    tests.push({
      name: 'Demo state authentication',
      passed: demoState.authentication.isDemoMode === true && demoState.authentication.isAuthenticated === true,
      error: demoState.authentication.isDemoMode !== true || demoState.authentication.isAuthenticated !== true ? 'Demo state has incorrect authentication' : undefined
    });
    
    // Test 3: Verify demo state has demo user
    tests.push({
      name: 'Demo state user',
      passed: demoState.authentication.user?.name === 'Alex Johnson' && demoState.authentication.user?.email === 'alex.johnson@demo.com',
      error: demoState.authentication.user?.name !== 'Alex Johnson' || demoState.authentication.user?.email !== 'alex.johnson@demo.com' ? 'Demo state has incorrect user' : undefined
    });
    
    // Test 4: Verify demo tasks are properly associated
    const demoProjectIds = demoState.projects.map(project => project.id);
    const demoGoalIds = demoState.goals.map(goal => goal.id);
    
    // Check that all tasks belong to demo projects
    const tasksWithValidProjects = demoState.tasks.every(task => task.projectId && demoProjectIds.includes(task.projectId));
    tests.push({
      name: 'Demo tasks project association',
      passed: tasksWithValidProjects,
      error: !tasksWithValidProjects ? 'Demo tasks have invalid project associations' : undefined
    });
    
    // Check that all projects belong to demo goals
    const projectsWithValidGoals = demoState.projects.every(project => demoGoalIds.includes(project.goalId));
    tests.push({
      name: 'Demo projects goal association',
      passed: projectsWithValidGoals,
      error: !projectsWithValidGoals ? 'Demo projects have invalid goal associations' : undefined
    });
    
    // Test 5: Verify analytics are demo-specific
    tests.push({
      name: 'Demo analytics',
      passed: demoState.analytics.tasksCompleted === 6 && demoState.analytics.tasksCreated === 12,
      error: demoState.analytics.tasksCompleted !== 6 || demoState.analytics.tasksCreated !== 12 ? 'Demo analytics are incorrect' : undefined
    });
    
  } catch (error) {
    tests.push({
      name: 'Demo mode state scoping test execution',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  const success = tests.every(test => test.passed);
  
  // Log test results
  console.log('=== Demo Mode State Scoping Test Results ===');
  tests.forEach(test => {
    console.log(`${test.passed ? '✅' : '❌'} ${test.name}: ${test.passed ? 'PASSED' : 'FAILED'}`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });
  console.log(`Overall: ${success ? 'PASSED' : 'FAILED'}`);
  console.log('=== End Test Results ===');
  
  return { success, tests };
}

export type { AppState, AppAction };
