import React, { createContext, useReducer, ReactNode, useEffect, useCallback, useRef } from 'react';
import { appReducer, type AppState, type AppAction } from './appReducer';
import { saveToStorage, loadFromStorage, isStorageAvailable } from '../utils/storage';

const initialState: AppState = {
  tasks: [
    {
      id: '1',
      title: 'Review quarterly metrics',
      description: 'Analyze Q4 performance and identify key insights',
      priority: 'high',
      status: 'in-progress',
      dueDate: new Date(2025, 0, 15),
      projectId: 'proj-1',
      createdAt: new Date(2025, 0, 1),
      tags: ['business', 'quarterly']
    },
    {
      id: '2',
      title: 'Update website content',
      description: 'Refresh homepage and about section',
      priority: 'medium',
      status: 'todo',
      dueDate: new Date(2025, 0, 20),
      projectId: 'proj-2',
      createdAt: new Date(2025, 0, 2),
      tags: ['marketing', 'website']
    },
    {
      id: '3',
      title: 'Client follow-up calls',
      priority: 'high',
      status: 'todo',
      dueDate: new Date(2025, 0, 12),
      createdAt: new Date(2025, 0, 5),
      tags: ['sales', 'communication']
    }
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'Business Analytics',
      description: 'Quarterly review and planning',
      color: '#D97757',
      createdAt: new Date(2024, 11, 15),
      tasks: [],
      progress: 45
    },
    {
      id: 'proj-2',
      name: 'Marketing Refresh',
      description: 'Website and content updates',
      color: '#B8956A',
      createdAt: new Date(2024, 11, 20),
      tasks: [],
      progress: 20
    }
  ],
  goals: [
    {
      id: 'goal-1',
      title: 'Increase revenue by 25%',
      description: 'Focus on customer acquisition and retention',
      targetDate: new Date(2025, 5, 30),
      progress: 30,
      milestones: [
        { id: 'm1', title: 'Launch new product line', completed: true, completedAt: new Date(2024, 11, 15) },
        { id: 'm2', title: 'Expand marketing reach', completed: false },
        { id: 'm3', title: 'Optimize pricing strategy', completed: false }
      ],
      createdAt: new Date(2024, 10, 1)
    }
  ],
  analytics: {
    tasksCompleted: 12,
    tasksCreated: 18,
    productivity: 78,
    streakDays: 5,
    averageCompletionTime: 2.3
  },
  searchQuery: '',
  selectedProject: null,
  selectedPriority: null
};

const STORAGE_KEY = 'task-manager-state';
const DEBOUNCE_DELAY = 500; // 500ms debounce delay

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
        return savedState;
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