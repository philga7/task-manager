/**
 * Test Utilities
 * 
 * This file provides reusable testing utilities and custom render functions
 * that wrap components with necessary providers (AppContext, Router, etc.)
 * 
 * Usage:
 * import { renderWithProviders } from '@/tests/test-utils';
 * renderWithProviders(<MyComponent />);
 */

import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

/**
 * Custom render function that wraps components with Router
 * 
 * Use this when testing components that use React Router hooks
 * (useNavigate, useParams, etc.)
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
 * Custom render function for components that need AppContext
 * 
 * TODO: Implement this when testing components that use useApp()
 * This will require creating a mock AppContext provider
 * 
 * @example
 * renderWithAppContext(<TaskCard task={mockTask} />);
 */
// export function renderWithAppContext(
//   ui: ReactElement,
//   options?: Omit<RenderOptions, 'wrapper'>
// ) {
//   // Implementation will be added when testing components that use AppContext
// }

/**
 * Mock Data Generators
 * 
 * These functions create mock data for testing
 */

/**
 * Creates a mock task object for testing
 */
export function createMockTask(overrides = {}) {
  return {
    id: 'test-task-1',
    title: 'Test Task',
    description: 'Test task description',
    status: 'todo' as const,
    priority: 'medium' as const,
    createdAt: new Date('2024-01-01'),
    tags: [],
    ...overrides,
  };
}

/**
 * Creates a mock project object for testing
 */
export function createMockProject(overrides = {}) {
  return {
    id: 'test-project-1',
    name: 'Test Project',
    description: 'Test project description',
    color: '#D97757',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * Creates a mock goal object for testing
 */
export function createMockGoal(overrides = {}) {
  return {
    id: 'test-goal-1',
    title: 'Test Goal',
    description: 'Test goal description',
    targetDate: new Date('2024-12-31'),
    progress: 0,
    milestones: [],
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
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
 */

