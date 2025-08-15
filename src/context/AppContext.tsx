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
  },
  authentication: {
    user: null,
    isAuthenticated: false,
    isDemoMode: false
  }
};

// Storage key constants
const DEMO_STORAGE_KEY = 'task-manager-demo-state';
const LEGACY_STORAGE_KEY = 'task-manager-state';
const DEBOUNCE_DELAY = 500; // 500ms debounce delay

// Helper function to get user-specific storage key
function getUserStorageKey(userId: string): string {
  return `task-manager-state-${userId}`;
}

// Helper function to get current storage key based on authentication state
function getCurrentStorageKey(authentication: AppState['authentication']): string {
  if (authentication.isDemoMode) {
    return DEMO_STORAGE_KEY;
  }
  if (authentication.isAuthenticated && authentication.user) {
    return getUserStorageKey(authentication.user.id);
  }
  return LEGACY_STORAGE_KEY; // Fallback for backward compatibility
}

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
  authentication?: AuthenticationState;
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
    goals: updatedGoals,
    authentication: savedState.authentication || {
      user: null,
      isAuthenticated: false,
      isDemoMode: false
    }
  } as AppState;
}

// Helper function to load state from appropriate storage key
function loadStateFromStorage(authentication: AppState['authentication']): AppState | null {
  try {
    if (!isStorageAvailable()) {
      console.warn('localStorage is not available, using initial state');
      return null;
    }

    const storageKey = getCurrentStorageKey(authentication);
    console.log(`Attempting to load state from storage key: ${storageKey}`);
    
    const savedState = loadFromStorage(storageKey);
    if (savedState) {
      console.log(`Loaded state from storage key: ${storageKey}`);
      return migrateState(savedState);
    }

    // If no data found in current storage key, try legacy key for backward compatibility
    if (storageKey !== LEGACY_STORAGE_KEY) {
      console.log('No data found in current storage key, trying legacy key for backward compatibility');
      const legacyState = loadFromStorage(LEGACY_STORAGE_KEY);
      if (legacyState) {
        console.log('Loaded state from legacy storage key');
        return migrateState(legacyState);
      }
    }

    console.log('No saved state found, using initial state');
    return null;
  } catch (error) {
    console.error('Error loading state from storage:', error);
    return null;
  }
}

export const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  // Lazy initialization to load state from localStorage on first render
  const [state, dispatch] = useReducer(appReducer, initialState, () => {
    const loadedState = loadStateFromStorage(initialState.authentication);
    return loadedState || initialState;
  });

  // Ref to store the debounce timeout
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced save function with authentication-aware storage key
  const debouncedSave = useCallback((currentState: AppState) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      try {
        if (isStorageAvailable()) {
          const storageKey = getCurrentStorageKey(currentState.authentication);
          saveToStorage(storageKey, currentState);
          console.log(`State saved to storage key: ${storageKey}`);
        }
      } catch (error) {
        console.error('Error saving state to storage:', error);
      }
    }, DEBOUNCE_DELAY);
  }, []);

  // Save state to localStorage whenever state changes
  useEffect(() => {
    debouncedSave(state);
  }, [state, debouncedSave]);

  // Track previous authentication state to detect changes
  const prevAuthRef = useRef(state.authentication);

  // Handle authentication state changes and load appropriate data
  useEffect(() => {
    const { authentication } = state;
    const prevAuth = prevAuthRef.current;
    
    // Check if authentication state has actually changed
    const authChanged = 
      prevAuth.isAuthenticated !== authentication.isAuthenticated ||
      prevAuth.isDemoMode !== authentication.isDemoMode ||
      prevAuth.user?.id !== authentication.user?.id;
    
    if (authChanged && (authentication.isAuthenticated || authentication.isDemoMode)) {
      console.log('Authentication state changed, loading user data...');
      const loadedState = loadStateFromStorage(authentication);
      if (loadedState) {
        // Update state with loaded data while preserving authentication state
        const updatedState = {
          ...loadedState,
          authentication: authentication
        };
        
        // Dispatch a custom action to update the state
        dispatch({ type: 'LOAD_USER_DATA', payload: updatedState });
      }
    }
    
    // Update the ref with current authentication state
    prevAuthRef.current = authentication;
  }, [state.authentication, dispatch]);

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