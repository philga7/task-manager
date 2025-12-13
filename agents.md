# AI Agent Guidelines for Task Manager

## Project Overview

This is a React-based task management application built with TypeScript, featuring user authentication, project organization, goal setting, and real-time analytics. The application uses modern web technologies including Vite, Tailwind CSS, and React Router DOM.

## Project Architecture

### Core Components
- **AppContext**: Central state management using React Context API with useReducer pattern
- **Authentication System**: User registration, login, demo mode, and session management
- **Task Management**: CRUD operations for tasks with priority, due dates, and status tracking
- **Project Organization**: Hierarchical project structure with progress tracking
- **Goal Setting**: Long-term goals with milestone tracking and task linking
- **Analytics**: Real-time productivity metrics and completion visualization
- **Storage Layer**: Local Storage with robust data persistence and namespace isolation

### Key Files and Directories
- `src/context/`: State management (AppContext, appReducer, useApp)
- `src/components/`: UI components organized by feature (Auth, Tasks, Projects, Goals, UI)
- `src/pages/`: Main application pages (Dashboard, Tasks, Projects, Goals, Analytics, Settings)
- `src/services/`: External service integrations (emailService)
- `src/utils/`: Utility functions (storage, validation, auth, demoData)
- `src/types/`: TypeScript type definitions

## AI Agent Responsibilities

### ALWAYS Do This
- **ALWAYS** analyze the existing codebase before making changes
- **ALWAYS** follow the established patterns in AppContext and appReducer for state management
- **ALWAYS** use TypeScript interfaces from `src/types/index.ts` for type safety
- **ALWAYS** implement proper error handling with user-friendly messages
- **ALWAYS** maintain demo mode compatibility when adding new features
- **ALWAYS** use the existing storage utilities in `src/utils/storage.ts`
- **ALWAYS** follow the component structure patterns established in existing components
- **ALWAYS** test authentication states (unauthenticated, authenticated, demo mode)
- **ALWAYS** use Tailwind CSS classes for styling consistency
- **ALWAYS** implement responsive design for mobile compatibility
- **ALWAYS** update the CHANGELOG.md for significant changes

### NEVER Do This
- **NEVER** modify the AppContext structure without updating appReducer
- **NEVER** bypass the authentication system or demo mode isolation
- **NEVER** use localStorage directly - always use the storage utilities
- **NEVER** create components without proper TypeScript typing
- **NEVER** ignore the existing error boundary and validation patterns
- **NEVER** break the task-project-goal relationship hierarchy
- **NEVER** remove demo mode functionality
- **NEVER** use inline styles instead of Tailwind CSS classes
- **NEVER** forget to handle loading states and error states
- **NEVER** modify the semantic versioning system without proper testing

## Development Patterns

### State Management
```typescript
// ALWAYS follow this pattern for state updates
const [state, dispatch] = useApp();

// Use typed actions from appReducer
dispatch({ type: 'ADD_TASK', payload: newTask });

// ALWAYS validate data before dispatching
if (isValidTask(newTask)) {
  dispatch({ type: 'ADD_TASK', payload: newTask });
}
```

### Component Structure
```typescript
// ALWAYS follow this component pattern
interface ComponentProps {
  // Define clear, typed props
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  const [state, dispatch] = useApp();
  
  // Handle loading and error states
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div className="space-y-4">
      {/* Use Tailwind CSS classes */}
    </div>
  );
};
```

### Storage Operations
```typescript
// ALWAYS use storage utilities, never localStorage directly
import { saveToStorage, loadFromStorage } from '../utils/storage';

// For demo mode compatibility
const data = loadFromStorage('demo');
saveToStorage('demo', updatedData);
```

## File Interaction Standards

### Component Development
- **ALWAYS** place components in appropriate feature directories
- **ALWAYS** create index.ts files for clean imports
- **ALWAYS** use the existing UI components from `src/components/UI/`
- **ALWAYS** implement proper prop validation and default values

### State Management
- **ALWAYS** add new state properties to the AppState interface
- **ALWAYS** create corresponding reducer actions in appReducer
- **ALWAYS** update the useApp hook for new state access patterns
- **ALWAYS** maintain backward compatibility for existing data

### Storage Management
- **ALWAYS** use the storage namespace system for demo mode isolation
- **ALWAYS** implement data migration for schema changes
- **ALWAYS** validate data integrity on load
- **ALWAYS** handle storage quota limits gracefully

## Decision-Making Guidelines

### Priority Order for AI Decisions
1. **Data Integrity**: Preserve user data and prevent corruption
2. **User Experience**: Maintain smooth, responsive interactions
3. **Demo Mode Compatibility**: Ensure demo functionality remains intact
4. **Code Consistency**: Follow established patterns and conventions
5. **Performance**: Optimize for fast loading and smooth interactions
6. **Accessibility**: Maintain keyboard navigation and screen reader support

### When Adding New Features
1. **ALWAYS** check if it affects authentication or demo mode
2. **ALWAYS** consider the impact on existing data structures
3. **ALWAYS** implement proper loading and error states
4. **ALWAYS** test across different user states
5. **ALWAYS** update TypeScript interfaces and validation

## Code Review Checklist

### Before Submitting Changes
- [ ] TypeScript compilation passes without errors
- [ ] All existing functionality works in demo mode
- [ ] Authentication flows remain intact
- [ ] Mobile responsiveness is maintained
- [ ] Error handling is implemented
- [ ] Loading states are properly managed
- [ ] Storage operations use proper utilities
- [ ] Component follows established patterns
- [ ] Tailwind CSS classes are used consistently
- [ ] No console errors in browser developer tools

### Testing Requirements
- [ ] Test in unauthenticated mode
- [ ] Test in authenticated mode
- [ ] Test in demo mode
- [ ] Test on mobile devices
- [ ] Test data persistence across page refreshes
- [ ] Test error scenarios and recovery

## Testing Standards

### Test Framework
- **Unit Testing**: Vitest with React Testing Library
- **E2E Testing**: Playwright with multi-browser support (Chrome, Firefox, Mobile Safari, Mobile Android)
- **Test Location**: 
  - Unit tests: Component tests live next to components (`ComponentName.test.tsx`)
  - E2E tests: `tests/e2e/` directory
- **Test Utilities**: Use `src/tests/test-utils.tsx` for reusable patterns
- **Coverage**: Run `npm run test:coverage` to generate reports

### Writing Tests
- **ALWAYS** follow the AAA pattern (Arrange-Act-Assert)
- **ALWAYS** use accessibility-first queries (getByRole, getByLabelText)
- **ALWAYS** use userEvent instead of fireEvent for interactions
- **ALWAYS** test user-visible behavior, not implementation details
- **ALWAYS** write descriptive test names that explain intent
- **ALWAYS** test edge cases (empty states, long text, past dates, null values)
- **ALWAYS** mock external dependencies (API calls, localStorage)

### Test Patterns
```typescript
// ✅ Good - Tests behavior
it('should disable submit button when form is invalid', async () => {
  const user = userEvent.setup();
  render(<TaskForm />);
  
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(screen.getByRole('button')).toBeDisabled();
});

// ❌ Bad - Tests implementation
it('should set isValid to false', () => {
  expect(component.state.isValid).toBe(false);
});
```

### Running Tests
```bash
npm test              # Watch mode for development
npm run test:run      # Single run for CI/CD
npm run test:ui       # Visual test dashboard
npm run test:coverage # Generate coverage reports

# E2E Tests (Playwright)
npm run test:e2e        # Run all E2E tests across all browsers
npm run test:e2e:ui     # Open Playwright UI mode for debugging
npm run test:e2e:headed # Run with visible browser windows
npm run test:e2e:debug  # Debug mode with step-through execution
npm run test:e2e:report # Show HTML test report
```

### Test Coverage Requirements
- **Minimum Coverage**: 80% for new components
- **Required Tests**: All public component props and user interactions
- **Excluded from Coverage**: Test files, config files, types-only files
- **Current Project Coverage**: 
  - **Unit Tests**: 556 tests across 14 test suites ✅
  - **E2E Tests**: 24 tests across 4 browser configurations ✅
 - Authentication utilities: 109 tests, 71.87% coverage ✅
 - Validation utilities: 79 tests, 99.21% coverage ✅
 - RegisterForm component: 57 tests, 95.0% coverage ✅
 - **TaskForm component: 52 tests, 82.75% coverage** ✅
 - LoginForm component: 49 tests, 93.54% coverage ✅
 - Storage utilities: 46 tests, 100% pass rate ✅
 - EmptyState component: 42 tests, 88.88% coverage ✅
 - **TaskCard component: 32 tests, 93.33% coverage** ✅
 - ErrorBoundary component: 31 tests, 95.0% coverage ✅
 - LoadingSpinner component: 25 tests, 100% coverage ✅
 - Button component: 14 tests, 100% coverage ✅
 - Card component: 13 tests, 100% coverage ✅
 - React integration: 4 tests ✅
 - Setup/config: 3 tests ✅

### Testing Components with Context
```typescript
// Use test utilities for components that need AppContext
import { renderWithAppContext } from '@/tests/test-utils';

it('should display tasks from context', () => {
  renderWithAppContext(<TaskList />, { 
    initialState: { tasks: [mockTask] } 
  });
  
  expect(screen.getByText('Test Task')).toBeInTheDocument();
});
```

### Testing Async Behavior
```typescript
// Use findBy queries for async elements
const element = await screen.findByText('Loaded data');

// Or use waitFor for complex conditions
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

### E2E Testing with Playwright
- **Browser Coverage**: Desktop Chrome, Desktop Firefox, Mobile Safari (iPhone 14), Mobile Android (Pixel 7)
- **Configuration**: `playwright.config.ts` defines browser projects and test settings
- **Test Structure**: E2E tests use `.spec.ts` extension in `tests/e2e/` directory
- **Best Practices**:
  - **ALWAYS** use accessibility-first queries (getByRole, getByLabelText)
  - **ALWAYS** test user-visible behavior, not implementation details
  - **ALWAYS** use `.first()` when multiple elements match and you just need to verify existence
  - **ALWAYS** include mobile device testing (critical for Safari-specific issues)
  - **NEVER** use `getByTestId` unless absolutely necessary (prefer accessibility queries)
  - **NEVER** hardcode selectors based on CSS classes (use semantic queries)
- **Running E2E Tests**: Tests automatically start dev server on `http://localhost:5173`
- **Current E2E Status**: 24 tests (6 smoke tests × 4 browsers) - all passing ✅

### Prohibited Testing Practices
- **NEVER** test third-party libraries (trust they work)
- **NEVER** use snapshots as the primary testing method
- **NEVER** write tests that depend on each other
- **NEVER** use `any` type in test files
- **NEVER** skip testing error states and edge cases
- **NEVER** test implementation details (internal state, private methods)
- **NEVER** use hardcoded empty arrays as test data (use realistic mock data)
- **NEVER** suppress warnings instead of fixing root causes (fix environment variable conflicts properly)

### Validation Testing Best Practices (Reference: validation.test.ts)
The validation utilities test suite demonstrates exemplary TDD practices:

**Mock Data Strategy**:
```typescript
// ✅ Good - Realistic mock data with proper structure
const createMockTask = (overrides = {}) => ({
  id: 'task-001',
  title: 'Test Task',
  priority: 'medium',
  status: 'todo',
  createdAt: new Date('2024-01-01'),
  tags: [],
  ...overrides,
});

// ❌ Bad - Hardcoded empty arrays
const task = { id: '', title: '', tags: [] };
```

**Edge Case Coverage**:
- ✅ Unicode characters (emoji 🚀, Chinese 中文, Cyrillic Русский)
- ✅ Special characters (`<script>`, quotes, symbols)
- ✅ Very long strings (5000+ characters)
- ✅ Empty vs undefined vs whitespace-only strings
- ✅ Boundary values (0, 100, -10, 150)
- ✅ Circular dependencies and complex graph patterns

**Test Organization**:
- Group tests by function in describe blocks
- Use nested describe blocks for test categories (Happy Path, Error Cases, Warning Cases, Edge Cases)
- Write descriptive test names: "should return valid when task exists and belongs to same project"
- Follow AAA pattern consistently (Arrange-Act-Assert)

**Comprehensive Assertions**:
```typescript
// ✅ Good - Multiple specific assertions
expect(result.isValid).toBe(false);
expect(result.errors).toHaveLength(1);
expect(result.errors[0].field).toBe('title');
expect(result.errors[0].message).toBe('Task title is required');
expect(result.errors[0].severity).toBe('error');

// ❌ Bad - Single vague assertion
expect(result).toBeTruthy();
```

**Documentation**:
- Add inline comments explaining complex test logic
- Create separate .test.md file for comprehensive documentation
- Document edge cases and why they're important
- Include coverage analysis and maintenance guidelines

### Storage Testing Best Practices (Reference: storage.test.ts)
The storage utilities test suite demonstrates comprehensive TDD methodology and critical bug validation:

**Critical Test Areas**:
```typescript
// ✅ Namespace Isolation (CRITICAL for demo mode)
describe('Namespace Isolation', () => {
  it('should add "demo:" prefix in demo mode', () => {
    sessionStorage.setItem('task_manager_session', JSON.stringify({ isDemoMode: true }));
    saveToStorage('task-manager-state', demoState);
    expect(localStorage.getItem('demo:task-manager-state')).not.toBeNull();
  });
  
  it('should isolate demo data from real user data', () => {
    // Save real data
    sessionStorage.setItem('task_manager_session', JSON.stringify({ isDemoMode: false }));
    saveToStorage('key', realState);
    
    // Save demo data
    sessionStorage.setItem('task_manager_session', JSON.stringify({ isDemoMode: true }));
    saveToStorage('key', demoState);
    
    // Verify both exist independently
    expect(localStorage.getItem('key')).not.toBeNull(); // Real data
    expect(localStorage.getItem('demo:key')).not.toBeNull(); // Demo data
  });
});
```

**Storage Mock Strategy**:
```typescript
// ✅ Good - Custom StorageMock implementing Storage interface
class StorageMock implements Storage {
  private store: Record<string, string> = {};
  
  getItem(key: string): string | null {
    return this.store[key] || null;
  }
  
  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
  
  removeItem(key: string): void {
    delete this.store[key];
  }
  
  clear(): void {
    this.store = {};
  }
  
  key(index: number): string | null {
    return Object.keys(this.store)[index] || null;
  }
  
  get length(): number {
    return Object.keys(this.store).length;
  }
}

// Use in beforeEach for test isolation
beforeEach(() => {
  localStorageMock = new StorageMock();
  sessionStorageMock = new StorageMock();
  
  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
  
  Object.defineProperty(global, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
  });
});
```

**Console Output Management**:
```typescript
// ✅ Suppress expected errors for clean test output
beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});
```

**Historical Bug Validation**:
- ✅ Demo mode data leakage (Task 9f78e309) - 5 namespace isolation tests
- ✅ iPhone Safari compatibility (Task 3a38bbe8) - Mobile browser fallback tests
- ✅ Authentication corruption (Task 4e3428a6) - Deployment validation tests

**Test Organization**:
- 10 test groups covering all functionality
- 46 comprehensive tests (306% over target)
- Integration tests for complete workflows
- Edge cases: empty data, large data (10K tasks), concurrent operations
- Error handling: QuotaExceededError, corrupted data, missing properties

**Key Learnings**:
- Mock storage instances, not prototypes
- Test namespace isolation thoroughly (critical for demo mode)
- Suppress expected console errors for clean output
- Use realistic mock data with Date objects
- Test complete save/load cycles, not just individual functions
- Document historical bugs that tests validate

### Auth Component Testing Best Practices (Reference: LoginForm.test.tsx, RegisterForm.test.tsx)
The authentication form test suites demonstrate comprehensive form testing with 106 combined tests:

**Mock Props Factory Pattern**:
```typescript
// ✅ Good - Reusable mock props with overrides
const createMockProps = (overrides = {}) => ({
  onClose: vi.fn(),
  onSwitchToRegister: vi.fn(),
  onSubmit: vi.fn(),
  isLoading: false,
  error: undefined as string | undefined,
  ...overrides,
});

// Usage in tests
render(<LoginForm {...createMockProps({ isLoading: true })} />);
```

**Form Validation Testing**:
```typescript
// ✅ Test HTML5 native validation AND custom validation
it('should have required attribute for native validation', () => {
  render(<LoginForm {...createMockProps()} />);
  expect(screen.getByPlaceholderText(/enter your email/i)).toHaveAttribute('required');
});

it('should show error for invalid email format', async () => {
  // Use email that passes browser but fails custom regex
  await user.type(emailInput, 'test@test'); // Missing domain extension
  await user.click(submitButton);
  expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
});
```

**Password Strength Indicator Testing**:
```typescript
// ✅ Test progressive strength levels
const strengthTests = [
  { input: 'abc', expected: 'Weak' },
  { input: 'Abcdefgh', expected: 'Fair' },
  { input: 'Abcdefg1', expected: 'Good' },
  { input: 'Abcdefg1!', expected: 'Strong' },
];

strengthTests.forEach(({ input, expected }) => {
  it(`should show "${expected}" for password: ${input}`, async () => {
    await user.type(passwordInput, input);
    expect(screen.getByText(new RegExp(expected, 'i'))).toBeInTheDocument();
  });
});
```

**Loading State Testing**:
```typescript
// ✅ Test all inputs/buttons disabled during loading
it('should disable all form controls when loading', () => {
  render(<LoginForm {...createMockProps({ isLoading: true })} />);
  
  expect(screen.getByPlaceholderText(/email/i)).toBeDisabled();
  expect(screen.getByPlaceholderText(/password/i)).toBeDisabled();
  expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
});
```

**Password Visibility Toggle Testing**:
```typescript
// ✅ Test toggle behavior
it('should toggle password visibility', async () => {
  const passwordInput = screen.getByPlaceholderText(/password/i);
  const toggleButton = passwordInput.parentElement?.querySelector('button');
  
  expect(passwordInput).toHaveAttribute('type', 'password');
  await user.click(toggleButton!);
  expect(passwordInput).toHaveAttribute('type', 'text');
  await user.click(toggleButton!);
  expect(passwordInput).toHaveAttribute('type', 'password');
});
```

**Key Testing Categories for Auth Forms**:
- ✅ Basic Rendering (heading, inputs, buttons, labels)
- ✅ Form Validation (required fields, format validation, length requirements)
- ✅ Password Strength (Weak/Fair/Good/Strong indicators)
- ✅ Password Match (confirmation field validation)
- ✅ Loading State (disabled controls, loading text)
- ✅ Error Display (auth errors with proper ARIA attributes)
- ✅ User Interactions (close, switch forms, submit)
- ✅ Accessibility (labels, keyboard navigation, ARIA)
- ✅ Edge Cases (unicode, special characters, boundary values)

### Task Component Testing Best Practices (Reference: TaskCard.test.tsx, TaskForm.test.tsx)
The Task component test suites demonstrate comprehensive component testing with 84 combined tests:

**Using renderWithAppContext for Context-Dependent Components**:
```typescript
// ✅ Custom render function wraps component with mocked AppContext
import { renderWithAppContext, createMockTask, createMockProject } from '../../tests/test-utils';

it('should dispatch UPDATE_TASK when toggling completion', async () => {
  const task = createMockTask({ status: 'todo' });
  const { mockDispatch } = renderWithAppContext(<TaskCard task={task} />);
  
  await user.click(screen.getByRole('button'));
  
  expect(mockDispatch).toHaveBeenCalledWith({
    type: 'UPDATE_TASK',
    payload: expect.objectContaining({ status: 'completed' })
  });
});
```

**Testing Form Fields Without htmlFor/id Associations**:
```typescript
// ✅ Use helper function when labels don't have proper associations
const getFormElements = (container: HTMLElement) => ({
  titleInput: () => screen.getByPlaceholderText(/enter task title/i),
  prioritySelect: () => container.querySelectorAll('select')[0] as HTMLSelectElement,
  projectSelect: () => container.querySelectorAll('select')[1] as HTMLSelectElement,
  dateInput: () => container.querySelector('input[type="date"]') as HTMLInputElement,
});

it('should update priority when user selects', async () => {
  const { container } = renderWithAppContext(<TaskForm onClose={mockOnClose} />);
  const { prioritySelect } = getFormElements(container);
  
  await user.selectOptions(prioritySelect(), 'high');
  expect(prioritySelect()).toHaveValue('high');
});
```

**Testing Create vs Edit Mode**:
```typescript
// ✅ Test both modes with appropriate assertions
it('should show "New Task" heading when creating', () => {
  renderWithAppContext(<TaskForm onClose={mockOnClose} />);
  expect(screen.getByRole('heading', { name: /new task/i })).toBeInTheDocument();
});

it('should show "Edit Task" heading when editing', () => {
  const task = createMockTask({ title: 'Existing Task' });
  renderWithAppContext(<TaskForm onClose={mockOnClose} task={task} />);
  expect(screen.getByRole('heading', { name: /edit task/i })).toBeInTheDocument();
});
```

**Testing Tag Parsing**:
```typescript
// ✅ Test comma-separated tags are parsed correctly
it('should parse comma-separated tags into array', async () => {
  const { mockDispatch } = renderWithAppContext(<TaskForm onClose={mockOnClose} />);
  
  await user.type(screen.getByPlaceholderText(/enter task title/i), 'Task');
  await user.type(screen.getByPlaceholderText(/tags/i), 'bug, urgent, frontend');
  await user.click(screen.getByRole('button', { name: /create task/i }));
  
  expect(mockDispatch).toHaveBeenCalledWith({
    type: 'ADD_TASK',
    payload: expect.objectContaining({ tags: ['bug', 'urgent', 'frontend'] })
  });
});
```

**Testing Priority Color Schemes**:
```typescript
// ✅ Test priority-based styling
it('should apply red color scheme for high priority', () => {
  const task = createMockTask({ priority: 'high' });
  const { container } = renderWithAppContext(<TaskCard task={task} />);
  const card = container.firstChild as HTMLElement;
  
  expect(card.className).toMatch(/bg-red-950/);
  expect(card.className).toMatch(/border-red-800/);
});
```

**Handling Timezone-Resilient Date Testing**:
```typescript
// ✅ Use regex patterns for date formatting tests
it('should display formatted due date when provided', () => {
  const dueDate = new Date('2024-12-15T12:00:00');  // Use midday to avoid edge cases
  const task = createMockTask({ dueDate });
  
  renderWithAppContext(<TaskCard task={task} />);
  
  // Match pattern instead of exact string to avoid timezone issues
  const dateElement = screen.getByText(/Dec \d{1,2}/);
  expect(dateElement).toBeInTheDocument();
});
```

**Key Testing Categories for Task Components**:
- ✅ Basic Rendering (title, description, priority, due date, tags)
- ✅ Create vs Edit mode differentiation
- ✅ Form field population and changes
- ✅ Form submission (ADD_TASK vs UPDATE_TASK dispatch)
- ✅ Completion toggle with status and completedAt updates
- ✅ Priority-based color schemes
- ✅ Tag parsing (comma-separated to array)
- ✅ Modal interactions (open, close, cancel)
- ✅ Edge cases (unicode, special chars, long text)
- ✅ Event propagation (toggle click stops propagation)

### ErrorBoundary Testing Best Practices (Reference: ErrorBoundary.test.tsx)
The ErrorBoundary test suite demonstrates React error boundary testing with 31 tests:

**Test Components for Error Triggering**:
```typescript
// ✅ Create controllable error-throwing components
function ThrowError({ shouldThrow, errorMessage = 'Test error' }: Props) {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div data-testid="child-component">Success</div>;
}

function ThrowTypedError({ errorType }: { errorType: 'TypeError' | 'ReferenceError' }) {
  if (errorType === 'TypeError') throw new TypeError('Type error');
  throw new ReferenceError('Reference error');
}
```

**Mocking Error Reporting Utilities**:
```typescript
// ✅ Mock issue reporting to prevent side effects
vi.mock('../../utils/issueReporting', () => ({
  createIssueReport: vi.fn(() => ({ id: 'test-id', ... })),
  generateGitHubIssueUrl: vi.fn(() => 'https://github.com/...'),
  saveIssueReport: vi.fn(),
}));
```

**Testing Error Recovery**:
```typescript
// ✅ Test recovery buttons
it('should call reload when Refresh Page clicked', async () => {
  render(<ErrorBoundary><ThrowError shouldThrow={true} /></ErrorBoundary>);
  await user.click(screen.getByRole('button', { name: /refresh page/i }));
  expect(window.location.reload).toHaveBeenCalled();
});
```

**Key Testing Categories for Error Boundaries**:
- ✅ Children rendering when no error
- ✅ Custom fallback rendering
- ✅ Error UI display (heading, buttons, icons)
- ✅ Recovery mechanisms (Try Again, Refresh, Report)
- ✅ Issue reporting integration
- ✅ Different error types (TypeError, ReferenceError)
- ✅ Edge cases (empty message, undefined stack)
- ✅ Accessibility (heading levels, keyboard navigation)

## Prohibited Actions

### Security and Data Protection
- **NEVER** expose user credentials or sensitive data
- **NEVER** bypass authentication checks
- **NEVER** allow demo data to leak into real user data
- **NEVER** store sensitive information in localStorage without encryption

### Code Quality
- **NEVER** use `any` type in TypeScript
- **NEVER** ignore ESLint warnings or errors
- **NEVER** create components without proper error boundaries
- **NEVER** use deprecated React patterns or APIs

### User Experience
- **NEVER** break existing user workflows
- **NEVER** remove accessibility features
- **NEVER** ignore mobile responsiveness
- **NEVER** create infinite loading states

## AI Agent Communication Standards

### When Reporting Issues
- **ALWAYS** include the specific user state (unauthenticated/authenticated/demo)
- **ALWAYS** describe the expected vs actual behavior
- **ALWAYS** mention if the issue affects mobile devices
- **ALWAYS** include relevant console errors or warnings

### When Proposing Solutions
- **ALWAYS** explain the impact on existing functionality
- **ALWAYS** consider the demo mode implications
- **ALWAYS** describe the testing approach
- **ALWAYS** mention any data migration requirements

## Performance Guidelines

### Optimization Priorities
1. **Bundle Size**: Keep the application lightweight
2. **Loading Speed**: Minimize initial load time
3. **Responsiveness**: Ensure smooth interactions
4. **Memory Usage**: Avoid memory leaks in long-running sessions

### Best Practices
- **ALWAYS** use React.memo for expensive components
- **ALWAYS** implement proper cleanup in useEffect hooks
- **ALWAYS** debounce user input for search and filtering
- **ALWAYS** lazy load non-critical components

## Security Considerations

### Data Protection
- **ALWAYS** validate user input before processing
- **ALWAYS** sanitize data before storage
- **ALWAYS** implement proper session management
- **ALWAYS** handle authentication state securely

### Privacy
- **ALWAYS** respect user privacy settings
- **ALWAYS** provide clear data export/import options
- **ALWAYS** implement proper data cleanup for deleted accounts

## Troubleshooting Steps

### Common Issues
1. **Demo Mode Data Leakage**: Check storage namespace isolation
2. **Authentication State Loss**: Verify session persistence logic
3. **Mobile Rendering Issues**: Test responsive design patterns
4. **Storage Quota Errors**: Implement graceful degradation
5. **TypeScript Compilation Errors**: Check interface definitions

### Debugging Approach
1. **ALWAYS** check browser console for errors
2. **ALWAYS** verify storage state in developer tools
3. **ALWAYS** test in different user states
4. **ALWAYS** validate data integrity
5. **ALWAYS** check network requests and responses

## Integration Standards

### External Services
- **ALWAYS** use the emailService for issue reporting
- **ALWAYS** implement proper error handling for external APIs
- **ALWAYS** provide fallback behavior when services are unavailable
- **ALWAYS** respect rate limits and usage quotas

### Browser Compatibility
- **ALWAYS** test in Chrome, Firefox, Safari, and Edge
- **ALWAYS** ensure mobile Safari compatibility
- **ALWAYS** handle browser-specific storage limitations
- **ALWAYS** provide graceful degradation for unsupported features

## Cipher Memory System

Cipher is the project's knowledge memory layer for storing and retrieving facts across sessions.

### Using `cipher_extract_and_operate_memory`

**Required Format**: Pass `interaction` as an **array of strings**, where each string is a distinct factual statement:

```typescript
// ✅ CORRECT - Array of declarative facts
interaction: [
  "Task-manager project has 472 tests across 12 test suites.",
  "ErrorBoundary.test.tsx has 31 tests at 95% coverage.",
  "The createMockProps pattern provides reusable mock props."
]

// ❌ WRONG - Single instruction-style string (will be skipped)
interaction: "Remember this for project X: we have 472 tests..."

// ❌ WRONG - Strings starting with "User request:" or "Remember" (often skipped)
interaction: ["User request: Store this achievement...", "Remember that..."]
```

**Required Options for ADD Operations**:
```typescript
options: {
  enableBatchProcessing: true,   // Process multiple facts together
  useLLMDecisions: true,         // Use LLM for decision making
  similarityThreshold: 0.9,      // High = treats facts as new, triggers ADD
  confidenceThreshold: 0.3       // Low = allows more facts to be added
}
```

**Optional Metadata**:
```typescript
memoryMetadata: {
  projectId: "task-manager",     // Scope memories to project
  source: "cursor-agent"         // Track where memory came from
}
```

### Understanding Memory Events

| Event | Meaning |
|-------|---------|
| `ADD` | New memory created successfully |
| `UPDATE` | Existing similar memory was updated |
| `NONE` | No action taken (too similar or high confidence) |
| `DELETE` | Memory was removed (requires `enableDeleteOperations: true`) |

### Common Issues and Solutions

1. **Facts Skipped During Extraction** (extracted: 0)
   - Make facts longer and more detailed
   - Use declarative statements, not instructions
   - Avoid starting with "Remember" or "User request"

2. **Event is NONE Instead of ADD**
   - Increase `similarityThreshold` to 0.9 or 0.95
   - Decrease `confidenceThreshold` to 0.3 or lower
   - Check if similar memory already exists with `cipher_memory_search`

3. **Use `cipher_memory_search` First**
   - Always search before adding to avoid duplicates
   - Use specific keywords from the facts you want to store
   - Set `top_k: 10` for comprehensive results

### Best Practices

- **ALWAYS** use array format for `interaction` parameter
- **ALWAYS** write declarative factual statements
- **ALWAYS** include `enableBatchProcessing: true` in options
- **ALWAYS** search before adding to check for existing memories
- **NEVER** use instruction-style text like "Remember this..."
- **NEVER** expect single-string interactions to be extracted

---

This document provides comprehensive guidance for AI agents working on the Task Manager project. Follow these guidelines to ensure consistent, high-quality development that maintains the application's reliability and user experience.
