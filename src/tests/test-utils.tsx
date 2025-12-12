/**
 * Test Utilities
 * 
 * This file provides reusable testing utilities and custom render functions
 * that wrap components with necessary providers (AppContext, Router, etc.)
 * 
 * Usage:
 * import { renderWithAppContext } from '@/tests/test-utils';
 * renderWithAppContext(<TaskCard task={mockTask} />);
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { AppState, AppAction } from '../context/appReducer';
import { Task, Project, Goal, MobileCompatibilityState } from '../types';
import { vi, Mock } from 'vitest';

/**
 * Default initial state for testing
 * Provides a minimal valid AppState that components can work with
 */
export const defaultTestState: AppState = {
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
      name: 'Test User',
      email: 'test@example.com'
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

/**
 * Default mobile compatibility state for testing
 */
export const defaultMobileCompatibility: MobileCompatibilityState = {
  browserInfo: {
    isMobile: false,
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: true,
    isPrivateBrowsing: false,
    browserName: 'Chrome',
    browserVersion: '120.0',
    osName: 'macOS',
    osVersion: '14.0',
    supportsLocalStorage: true,
    supportsSessionStorage: true,
    supportsIndexedDB: true,
    supportsCookies: true,
    storageQuota: 5000000,
    hasStorageQuota: true
  },
  compatibility: {
    hasIssues: false,
    issues: [],
    recommendations: [],
    errorMessage: null
  },
  storageUsage: {
    localStorageSize: 0,
    sessionStorageSize: 0,
    totalSize: 0,
    quota: 5000000,
    usagePercentage: 0
  }
};

/**
 * Options for renderWithAppContext
 */
interface RenderWithAppContextOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Partial state to merge with default state */
  initialState?: Partial<AppState>;
  /** Custom dispatch function (defaults to vi.fn()) */
  dispatch?: Mock<[AppAction], void>;
  /** Custom mobile compatibility state */
  mobileCompatibility?: MobileCompatibilityState;
}

/**
 * Return type for renderWithAppContext
 * Includes the mock dispatch for assertions
 */
interface RenderWithAppContextResult extends ReturnType<typeof render> {
  /** Mock dispatch function for asserting actions */
  mockDispatch: Mock<[AppAction], void>;
}

/**
 * Custom render function for components that need AppContext
 * 
 * Wraps the component with a mocked AppContext provider, allowing you to:
 * - Provide initial state
 * - Assert on dispatched actions
 * - Test components in isolation
 * 
 * @example
 * // Basic usage
 * const { mockDispatch } = renderWithAppContext(<TaskCard task={mockTask} />);
 * 
 * @example
 * // With custom state
 * renderWithAppContext(<TaskList />, { 
 *   initialState: { tasks: [mockTask1, mockTask2] } 
 * });
 * 
 * @example
 * // Asserting dispatched actions
 * const { mockDispatch } = renderWithAppContext(<TaskCard task={mockTask} />);
 * await user.click(completeButton);
 * expect(mockDispatch).toHaveBeenCalledWith({ type: 'UPDATE_TASK', payload: expect.any(Object) });
 */
export function renderWithAppContext(
  ui: ReactElement,
  options: RenderWithAppContextOptions = {}
): RenderWithAppContextResult {
  const {
    initialState = {},
    dispatch,
    mobileCompatibility = defaultMobileCompatibility,
    ...renderOptions
  } = options;

  // Merge provided state with defaults
  const state: AppState = {
    ...defaultTestState,
    ...initialState,
    // Deep merge for nested objects
    analytics: {
      ...defaultTestState.analytics,
      ...(initialState.analytics || {})
    },
    userSettings: {
      ...defaultTestState.userSettings,
      ...(initialState.userSettings || {}),
      profile: {
        ...defaultTestState.userSettings.profile,
        ...(initialState.userSettings?.profile || {})
      },
      notifications: {
        ...defaultTestState.userSettings.notifications,
        ...(initialState.userSettings?.notifications || {})
      },
      appearance: {
        ...defaultTestState.userSettings.appearance,
        ...(initialState.userSettings?.appearance || {})
      }
    },
    authentication: {
      ...defaultTestState.authentication,
      ...(initialState.authentication || {})
    }
  };

  // Create mock dispatch if not provided
  const mockDispatch = dispatch || vi.fn<[AppAction], void>();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AppContext.Provider value={{ state, dispatch: mockDispatch, mobileCompatibility }}>
        <BrowserRouter>{children}</BrowserRouter>
      </AppContext.Provider>
    );
  }

  const renderResult = render(ui, { wrapper: Wrapper, ...renderOptions });

  return {
    ...renderResult,
    mockDispatch
  };
}

/**
 * Custom render function that wraps components with Router
 * 
 * Use this when testing components that use React Router hooks
 * (useNavigate, useParams, etc.) but don't need AppContext
 * 
 * @example
 * renderWithRouter(<MyComponent />);
 */
export function renderWithRouter(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <BrowserRouter>{children}</BrowserRouter>;
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Mock Data Generators
 * 
 * These functions create realistic mock data for testing.
 * Use overrides to customize specific properties for your test case.
 */

/**
 * Creates a mock task object for testing
 * 
 * @example
 * // Basic task
 * const task = createMockTask();
 * 
 * @example
 * // Completed task with tags
 * const completedTask = createMockTask({ 
 *   status: 'completed', 
 *   completedAt: new Date(),
 *   tags: ['bug', 'urgent'] 
 * });
 * 
 * @example
 * // High priority task with due date
 * const urgentTask = createMockTask({
 *   priority: 'high',
 *   dueDate: new Date('2024-12-25')
 * });
 */
export function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: `test-task-${Date.now()}`,
    title: 'Test Task',
    description: 'Test task description',
    status: 'todo',
    priority: 'medium',
    createdAt: new Date('2024-01-01'),
    tags: [],
    ...overrides,
  };
}

/**
 * Creates a mock project object for testing
 * 
 * @example
 * const project = createMockProject({ name: 'My Project' });
 */
export function createMockProject(overrides: Partial<Project> = {}): Project {
  return {
    id: `test-project-${Date.now()}`,
    name: 'Test Project',
    description: 'Test project description',
    color: '#D97757',
    goalId: 'test-goal-1',
    createdAt: new Date('2024-01-01'),
    tasks: [],
    progress: 0,
    ...overrides,
  };
}

/**
 * Creates a mock goal object for testing
 * 
 * @example
 * const goal = createMockGoal({ title: 'Q1 Objectives' });
 */
export function createMockGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: `test-goal-${Date.now()}`,
    title: 'Test Goal',
    description: 'Test goal description',
    targetDate: new Date('2024-12-31'),
    progress: 0,
    projects: [],
    milestones: [],
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * Creates a set of related mock data for integration testing
 * 
 * @example
 * const { task, project, goal } = createMockTaskHierarchy();
 */
export function createMockTaskHierarchy() {
  const goal = createMockGoal({ id: 'hierarchy-goal-1' });
  const project = createMockProject({ 
    id: 'hierarchy-project-1', 
    goalId: goal.id 
  });
  const task = createMockTask({ 
    id: 'hierarchy-task-1', 
    projectId: project.id 
  });
  
  return { task, project, goal };
}

/**
 * Testing Best Practices
 * 
 * 1. AAA Pattern (Arrange-Act-Assert):
 *    - Arrange: Set up test data and conditions
 *    - Act: Execute the code being tested
 *    - Assert: Verify the results
 * 
 * 2. Query Priority (from Testing Library):
 *    - getByRole (preferred for accessibility)
 *    - getByLabelText (for form fields)
 *    - getByPlaceholderText
 *    - getByText
 *    - getByTestId (last resort)
 * 
 * 3. User-Centric Testing:
 *    - Test from the user's perspective
 *    - Use userEvent instead of fireEvent
 *    - Test behavior, not implementation
 * 
 * 4. Async Testing:
 *    - Use await with userEvent interactions
 *    - Use waitFor for async state updates
 *    - Use findBy queries for elements that appear asynchronously
 * 
 * 5. Component Testing with Context:
 *    - Use renderWithAppContext for components using useApp()
 *    - Provide minimal initialState needed for your test
 *    - Assert on mockDispatch calls for state changes
 */

