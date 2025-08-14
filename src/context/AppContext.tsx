import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Task, Project, Goal, Analytics } from '../types';

interface AppState {
  tasks: Task[];
  projects: Project[];
  goals: Goal[];
  analytics: Analytics;
  searchQuery: string;
  selectedProject: string | null;
  selectedPriority: string | null;
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
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_PROJECT'; payload: string | null }
  | { type: 'SET_SELECTED_PRIORITY'; payload: string | null };

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

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task => 
          task.id === action.payload.id ? action.payload : task
        )
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload)
      };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id ? action.payload : project
        )
      };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload)
      };
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.payload] };
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map(goal =>
          goal.id === action.payload.id ? action.payload : goal
        )
      };
    case 'DELETE_GOAL':
      return {
        ...state,
        goals: state.goals.filter(goal => goal.id !== action.payload)
      };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_SELECTED_PROJECT':
      return { ...state, selectedProject: action.payload };
    case 'SET_SELECTED_PRIORITY':
      return { ...state, selectedPriority: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}