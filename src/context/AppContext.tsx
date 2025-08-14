import React, { createContext, useReducer, ReactNode, useEffect, useCallback, useRef } from 'react';
import { appReducer, type AppState, type AppAction } from './appReducer';
import { saveToStorage, loadFromStorage, isStorageAvailable } from '../utils/storage';
import { calculateProjectProgress, calculateGoalProgress } from '../utils/progress';

const initialState: AppState = {
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
  selectedPriority: null,
  userSettings: {
    profile: {
      name: 'Alex Morgan',
      email: 'alex@company.com'
    },
    notifications: {
      emailTasks: true,
      dailySummary: true,
      weeklyReports: false
    },
    appearance: {
      theme: 'dark',
      accentColor: '#D97757'
    }
  }
};

const STORAGE_KEY = 'task-manager-state';
const DEBOUNCE_DELAY = 500; // 500ms debounce delay

// Type for legacy state structure during migration
interface LegacyState {
  tasks?: Task[];
  projects?: Array<Partial<Project> & { goalId?: string }>;
  goals?: Array<Partial<Goal> & { projects?: Project[] }>;
  analytics?: {
    tasksCompleted: number;
    tasksCreated: number;
    productivity: number;
    streakDays: number;
    averageCompletionTime: number;
  };
  searchQuery?: string;
  selectedProject?: string | null;
  selectedPriority?: string | null;
  userSettings?: UserSettings;
}

// Migration function to handle existing data structure
function migrateState(savedState: LegacyState): AppState {
  // If the state already has the new structure, return as is
  if (savedState.projects?.[0]?.goalId !== undefined && savedState.goals?.[0]?.projects !== undefined) {
    return savedState as AppState;
  }

  // Migrate projects to include goalId (default to first goal or create one)
  const migratedProjects = savedState.projects?.map((project) => ({
    ...project,
    goalId: project.goalId || 'goal-1'
  })) || [];

  // Migrate goals to include projects array
  const migratedGoals = savedState.goals?.map((goal) => ({
    ...goal,
    projects: migratedProjects.filter((project) => project.goalId === goal.id)
  })) || [];

  // If no goals exist, create a default goal
  if (migratedGoals.length === 0) {
    migratedGoals.push({
      id: 'goal-1',
      title: 'Default Goal',
      description: 'Default goal for existing projects',
      targetDate: new Date(2025, 11, 31),
      progress: 0,
      projects: migratedProjects,
      milestones: [],
      createdAt: new Date()
    });
  }

  // Update project progress based on tasks
  const updatedProjects = migratedProjects.map((project) => {
    const projectTasks = savedState.tasks?.filter((task) => task.projectId === project.id) || [];
    const progressResult = calculateProjectProgress(projectTasks);
    
    return {
      ...project,
      progress: progressResult.percentage,
      tasks: projectTasks
    };
  });

  // Update goal progress based on projects
  const updatedGoals = migratedGoals.map((goal) => {
    const goalProjects = updatedProjects.filter((project) => project.goalId === goal.id);
    const progressResult = calculateGoalProgress(goalProjects);
    
    return {
      ...goal,
      progress: progressResult.percentage,
      projects: goalProjects
    };
  });

  return {
    ...savedState,
    projects: updatedProjects,
    goals: updatedGoals
  } as AppState;
}

export const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  // Lazy initialization to load state from localStorage on first render
  const [state, dispatch] = useReducer(appReducer, initialState, () => {
    try {
      // Check if localStorage is available
      if (!isStorageAvailable()) {
        console.warn('localStorage is not available, using initial state');
        return initialState;
      }

      // Try to load state from localStorage
      const savedState = loadFromStorage(STORAGE_KEY);
      if (savedState) {
        console.log('Loaded state from localStorage');
        return migrateState(savedState);
      }

      console.log('No saved state found, using initial state');
      return initialState;
    } catch (error) {
      console.error('Error loading state from localStorage:', error);
      console.log('Falling back to initial state');
      return initialState;
    }
  });

  // Ref to store the debounce timeout
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced save function
  const debouncedSave = useCallback((currentState: AppState) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      try {
        if (isStorageAvailable()) {
          saveToStorage(STORAGE_KEY, currentState);
          console.log('State saved to localStorage');
        }
      } catch (error) {
        console.error('Error saving state to localStorage:', error);
      }
    }, DEBOUNCE_DELAY);
  }, []);

  // Save state to localStorage whenever state changes
  useEffect(() => {
    debouncedSave(state);
  }, [state, debouncedSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}