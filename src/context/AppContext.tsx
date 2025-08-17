import React, { createContext, useReducer, ReactNode, useEffect, useCallback, useRef, useState } from 'react';
import { appReducer, type AppState, type AppAction } from './appReducer';
import { saveToStorage, loadFromStorage, isStorageAvailable, RobustStorage } from '../utils/storage';
import { calculateProjectProgress, calculateGoalProgress } from '../utils/progress';
import { getCurrentSessionUser, updateSessionActivity, checkMobileCompatibility, getStorageUsageInfo } from '../utils/auth';
import { detectMobileBrowser } from '../utils/mobileDetection';
import { MobileCompatibilityState, Task, Project, Goal, UserSettings, AuthenticationState } from '../types';
import { logState, logBrowser, logAuth, logStorage, logProfile } from '../utils/logger';

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
async function loadStateFromStorage(authentication: AppState['authentication']): Promise<AppState | null> {
  try {
    const storageKey = getCurrentStorageKey(authentication);
    logState.load(storageKey);

    // Try robust storage first
    const savedState = await RobustStorage.load(storageKey);
    if (savedState) {
      logState.loaded(storageKey, 'robust');
      return migrateState(savedState);
    }

    // Fallback to simple storage
    if (isStorageAvailable()) {
      const simpleState = loadFromStorage(storageKey);
      if (simpleState) {
        logState.loaded(storageKey, 'simple');
        return migrateState(simpleState);
      }
    }

    // If no data found in current storage key, try legacy key for backward compatibility
    if (storageKey !== LEGACY_STORAGE_KEY) {
      logState.load('legacy key for backward compatibility');
      
      // Try robust storage for legacy key
      const legacyState = await RobustStorage.load(LEGACY_STORAGE_KEY);
      if (legacyState) {
        logState.loaded(LEGACY_STORAGE_KEY, 'robust legacy');
        return migrateState(legacyState);
      }

      // Try simple storage for legacy key
      if (isStorageAvailable()) {
        const simpleLegacyState = loadFromStorage(LEGACY_STORAGE_KEY);
        if (simpleLegacyState) {
          logState.loaded(LEGACY_STORAGE_KEY, 'simple legacy');
          return migrateState(simpleLegacyState);
        }
      }
    }

    logState.notFound();
    return null;
  } catch (error) {
    logState.error('loading', error);
    return null;
  }
}

export const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  mobileCompatibility: MobileCompatibilityState;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  // State to track if initial load is complete
  const [isInitialized, setIsInitialized] = useState(false);
  
  // State to track mobile browser compatibility
  const [mobileCompatibility, setMobileCompatibility] = useState<MobileCompatibilityState>(() => {
    const browserInfo = detectMobileBrowser();
    const compatibility = checkMobileCompatibility();
    
    // Log browser information for debugging
    logBrowser.info(browserInfo, compatibility);
    
    return {
      browserInfo,
      compatibility: {
        hasIssues: !compatibility.isCompatible,
        issues: compatibility.issues,
        recommendations: compatibility.recommendations,
        errorMessage: compatibility.errorMessage
      },
      storageUsage: getStorageUsageInfo()
    };
  });
  
  // Lazy initialization to load state from localStorage on first render
  const [state, dispatch] = useReducer(appReducer, initialState, () => {
    // Start with initial state, will be updated after async load
    return initialState;
  });

  // Load initial state asynchronously
  useEffect(() => {
    const loadInitialState = async () => {
      // Check mobile browser compatibility first
      const compatibility = checkMobileCompatibility();
      if (compatibility.errorMessage) {
        logBrowser.warning(compatibility.errorMessage);
      }
      
      // First, try to restore authentication state from session
      const sessionUser = getCurrentSessionUser();
      let restoredAuthState = initialState.authentication;
      
      if (sessionUser) {
        logAuth.session('restoring', sessionUser.id);
        restoredAuthState = {
          user: sessionUser,
          isAuthenticated: true,
          isDemoMode: sessionUser.id === 'demo-user-id'
        };
      }
      
      // Then load user data from storage
      const loadedState = await loadStateFromStorage(restoredAuthState);
      if (loadedState) {
        // If we have a session user, ensure the loaded state includes the authentication info
        if (sessionUser) {
          loadedState.authentication = restoredAuthState;
        }
        dispatch({ type: 'LOAD_USER_DATA', payload: loadedState });
      } else if (sessionUser) {
        // If no loaded state but we have a session user, create a basic state
        const basicState = {
          ...initialState,
          authentication: restoredAuthState
        };
        dispatch({ type: 'LOAD_USER_DATA', payload: basicState });
      }
      
      // Update mobile compatibility info
      setMobileCompatibility(prev => ({
        ...prev,
        compatibility: {
          hasIssues: !compatibility.isCompatible,
          issues: compatibility.issues,
          recommendations: compatibility.recommendations,
          errorMessage: compatibility.errorMessage
        },
        storageUsage: getStorageUsageInfo()
      }));
      
      setIsInitialized(true);
    };
    
    loadInitialState();
  }, []);

  // Profile sync effect - runs after initial load and when authentication changes
  useEffect(() => {
    if (isInitialized && (state.authentication.isAuthenticated || state.authentication.isDemoMode)) {
      // Check if profile data needs syncing and dispatch sync action
      const needsSync = 
        state.authentication.user && 
        (state.authentication.user.name !== state.userSettings.profile.name ||
         state.authentication.user.email !== state.userSettings.profile.email);
      
      if (needsSync && state.authentication.user) {
        logProfile.sync(state.authentication.user.name, state.authentication.user.email, state.userSettings.profile);
        dispatch({ type: 'SYNC_PROFILE_DATA' });
      }
    }
  }, [isInitialized, state.authentication, state.userSettings.profile, dispatch]);

  // Ref to store the debounce timeout
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced save function with robust storage
  const debouncedSave = useCallback((currentState: AppState) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const storageKey = getCurrentStorageKey(currentState.authentication);
        
        // Try robust storage first, fallback to simple storage
        const success = await RobustStorage.save(storageKey, currentState);
        if (success) {
          logStorage.save(storageKey, 'robust');
        } else {
          logStorage.warn('Robust storage failed, falling back to simple storage');
          if (isStorageAvailable()) {
            saveToStorage(storageKey, currentState);
            logStorage.save(storageKey, 'simple');
          }
        }
      } catch (error) {
        logStorage.error('saving', error);
        // Fallback to simple storage
        try {
          if (isStorageAvailable()) {
            const storageKey = getCurrentStorageKey(currentState.authentication);
            saveToStorage(storageKey, currentState);
            logStorage.save(storageKey, 'fallback');
          }
        } catch (fallbackError) {
          logStorage.error('fallback', fallbackError);
        }
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
      logState.authChange();
      
      const loadUserData = async () => {
        const loadedState = await loadStateFromStorage(authentication);
        if (loadedState) {
          // Update state with loaded data while preserving authentication state
          const updatedState = {
            ...loadedState,
            authentication: authentication
          };
          
          // Dispatch a custom action to update the state
          dispatch({ type: 'LOAD_USER_DATA', payload: updatedState });
        }
      };
      
      loadUserData();
    }
    
    // Update the ref with current authentication state
    prevAuthRef.current = authentication;
  }, [state.authentication, dispatch, state]);

  // Activity tracking to keep session alive
  useEffect(() => {
    const handleUserActivity = () => {
      if (state.authentication.isAuthenticated) {
        updateSessionActivity();
      }
    };

    // Track user activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [state.authentication.isAuthenticated]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Show loading state until initial data is loaded
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-900">
        <div className="text-stone-400">Loading...</div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ 
      state, 
      dispatch,
      mobileCompatibility 
    }}>
      {children}
    </AppContext.Provider>
  );
}