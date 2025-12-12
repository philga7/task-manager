# Task Manager Development Standards

## Project Overview

**Technology Stack**: React 18, TypeScript, Vite, Tailwind CSS, React Router DOM, Lucide React, date-fns
**Architecture**: Context-based state management with useReducer pattern
**Core Functionality**: Task, Project, Goal management with analytics and progress tracking

## Project Architecture

### Directory Structure
- `src/components/` - Feature-based component organization
  - `Tasks/` - Task-related components
  - `Projects/` - Project-related components  
  - `Goals/` - Goal-related components
  - `Layout/` - Header, Sidebar, navigation components
  - `UI/` - Reusable UI components (Button, Card, ProgressBar)
- `src/pages/` - Route components (Dashboard, Tasks, Projects, Goals, Analytics, Settings)
- `src/context/` - AppContext with state management
- `src/types/` - TypeScript interfaces and type definitions

### State Management
- **Single Source of Truth**: AppContext with useReducer
- **Action Types**: Comprehensive CRUD operations for all entities
- **Error Handling**: Proper context validation in custom hooks

## Code Standards

### Component Development
- **Use Functional Components** with TypeScript interfaces
- **Props Destructuring** with default values
- **Conditional Rendering** with ternary operators
- **Event Handling** with proper TypeScript typing
- **Custom Hooks** for context consumption (useApp)

### TypeScript Standards
- **Define Interfaces** for all component props
- **Use Union Types** for status and priority values
- **Optional Properties** with `?` for non-required fields
- **Date Objects** for all date/time fields
- **String Arrays** for tags and similar collections

### Styling Standards
- **Tailwind CSS Only** - No custom CSS files
- **Color Scheme**: stone-950, stone-900, stone-800, stone-700, stone-400, stone-300, stone-200, stone-100
- **Primary Color**: #D97757 (custom orange)
- **Responsive Design**: Use md: breakpoints for mobile-first approach
- **Spacing**: Consistent padding and margins (p-3, p-4, space-x-2, space-x-3)
- **Typography**: text-sm, text-base, font-medium
- **Borders**: border-stone-800, rounded-xl, rounded-2xl
- **Transitions**: transition-all duration-250
- **Hover States**: hover:shadow-md, hover:border-stone-700

### File Naming Conventions
- **Components**: PascalCase (TaskCard.tsx, ProjectForm.tsx)
- **Pages**: PascalCase (Dashboard.tsx, Tasks.tsx)
- **Types**: camelCase interfaces (Task, Project, Goal)
- **Context**: AppContext.tsx
- **Hooks**: camelCase with 'use' prefix (useApp)

## Functionality Implementation Standards

### State Updates
- **Always Use Dispatch**: Never modify state directly
- **Action Types**: Use predefined action types from AppContext
- **Payload Structure**: Match interface definitions exactly
- **Date Handling**: Use new Date() for timestamps
- **ID Generation**: Use string IDs with descriptive prefixes

### Component Patterns
- **Form Components**: Include onClose callback for modal behavior
- **Card Components**: Include onClick for edit functionality
- **List Components**: Use map() with proper key props
- **Modal Components**: Use conditional rendering with state

### Data Validation
- **Required Fields**: title, id, createdAt for all entities
- **Optional Fields**: description, dueDate, completedAt
- **Enum Values**: priority ('low' | 'medium' | 'high'), status ('todo' | 'in-progress' | 'completed')
- **Array Fields**: tags, milestones with proper typing

## Framework/Library Usage Standards

### React Router DOM
- **BrowserRouter** as top-level router
- **Routes/Route** for page navigation
- **useNavigate** for programmatic navigation
- **Route Paths**: /, /tasks, /projects, /goals, /analytics, /settings

### Lucide React Icons
- **Import Specific Icons**: Calendar, Flag, CheckCircle2, Circle
- **Consistent Sizing**: w-3 h-3, w-4 h-4, w-5 h-5
- **Color Classes**: text-stone-400, text-green-500, text-red-500

### date-fns
- **Format Function**: format(date, 'MMM d') for display
- **Date Objects**: Always use Date objects, not strings

### Tailwind CSS
- **Custom Colors**: Use CSS variables for dynamic colors
- **Responsive Classes**: md: prefix for tablet+ breakpoints
- **Utility Classes**: Combine for complex styling
- **No Custom CSS**: All styling through Tailwind classes

## Workflow Standards

### Development Process
1. **Define Types** in src/types/index.ts first
2. **Update Context** with new action types and reducer cases
3. **Create Components** following established patterns
4. **Add Routes** in App.tsx and Sidebar.tsx
5. **Test Functionality** with proper state management

### State Management Flow
1. **User Action** triggers component event handler
2. **Dispatch Action** with proper payload structure
3. **Reducer Processes** action and returns new state
4. **Context Updates** all consuming components
5. **UI Re-renders** with updated data

### Task Management Rules
1. **Preserve Completed Tasks**: All completed tasks must be retained in the system
2. **Append New Tasks**: New tasks are always added to the existing task array
3. **No Task Deletion**: Completed tasks should never be automatically deleted
4. **Task History**: Maintain complete task history for analytics and reporting
5. **Status Updates**: Only update task status, never remove tasks from the array

### Error Handling
- **Context Validation**: Check context existence in custom hooks
- **Type Safety**: Use TypeScript for compile-time error prevention
- **Optional Chaining**: Use ?. for potentially undefined values
- **Default Values**: Provide fallbacks for missing data

## Key File Interaction Standards

### Multi-file Coordination Requirements

**When Adding New Data Types:**
- Update `src/types/index.ts` with new interfaces
- Update `src/context/AppContext.tsx` action types and reducer
- Update all related components to use new types

**When Adding New Actions:**
- Add action type to `AppAction` union in `src/context/AppContext.tsx`
- Add reducer case in `appReducer` function
- Update all components that dispatch the action

**When Adding New Routes:**
- Add route in `src/App.tsx` Routes component
- Add navigation item in `src/components/Layout/Sidebar.tsx`
- Create corresponding page component in `src/pages/`

**When Adding New UI Components:**
- Place in appropriate feature directory or `src/components/UI/`
- Follow established component patterns
- Use consistent prop interfaces and styling

**When Adding New Features:**
- Update `src/context/AppContext.tsx` state interface
- Add initial state values
- Update all related components and pages

## AI Decision-making Standards

### Component Creation Decision Tree
1. **Is it a reusable UI element?** → Create in `src/components/UI/`
2. **Is it feature-specific?** → Create in appropriate feature directory
3. **Is it a page/route?** → Create in `src/pages/`
4. **Does it need state management?** → Use AppContext dispatch

### State Management Decision Tree
1. **Is it local component state?** → Use useState
2. **Is it shared across components?** → Use AppContext
3. **Is it form data?** → Use local state with dispatch on submit
4. **Is it navigation state?** → Use AppContext (searchQuery, selectedProject)

### Styling Decision Tree
1. **Is it a standard UI element?** → Use existing UI components
2. **Is it a custom layout?** → Use Tailwind utility classes
3. **Is it a dynamic color?** → Use CSS variables with inline styles
4. **Is it responsive?** → Use md: breakpoint classes

### Priority Assessment Criteria
1. **High Priority**: Core functionality, data integrity, user experience
2. **Medium Priority**: UI improvements, performance optimizations
3. **Low Priority**: Nice-to-have features, cosmetic changes

## Prohibited Actions

### State Management
- ❌ **Never use useState for shared state**
- ❌ **Never modify state directly without dispatch**
- ❌ **Never create multiple contexts for related data**
- ❌ **Never use localStorage without AppContext integration**
- ❌ **Never delete or replace completed tasks when adding new ones**

### Component Development
- ❌ **Never create components without TypeScript interfaces**
- ❌ **Never use class components**
- ❌ **Never create components outside established directory structure**
- ❌ **Never duplicate existing functionality**

### Styling
- ❌ **Never use custom CSS files**
- ❌ **Never use inline styles except for dynamic colors**
- ❌ **Never use CSS-in-JS libraries**
- ❌ **Never use color values outside the established palette**

### Dependencies
- ❌ **Never add new dependencies without updating package.json**
- ❌ **Never use deprecated React patterns**
- ❌ **Never import unused dependencies**
- ❌ **Never use external state management libraries**

### File Organization
- ❌ **Never create files outside src/ directory**
- ❌ **Never mix feature components in wrong directories**
- ❌ **Never create duplicate type definitions**
- ❌ **Never skip updating related files when adding features**

## Examples

### ✅ Correct Component Pattern
```typescript
interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const { dispatch } = useApp();
  
  const handleComplete = () => {
    dispatch({ 
      type: 'UPDATE_TASK', 
      payload: { ...task, status: 'completed' } 
    });
  };
  
  return (
    <div className="bg-stone-900 rounded-2xl border border-stone-800 p-4">
      {/* Component content */}
    </div>
  );
}
```

### ❌ Incorrect Patterns
```typescript
// Wrong: No TypeScript interface
export function TaskCard(props) {
  // Component without proper typing
}

// Wrong: Direct state modification
const handleComplete = () => {
  task.status = 'completed'; // Never modify directly
};

// Wrong: Custom CSS
<div style={{ backgroundColor: '#custom-color' }}>
  {/* Use Tailwind classes instead */}
</div>
```

### ✅ Correct State Update
```typescript
// Correct: Using dispatch with proper action type
dispatch({ 
  type: 'UPDATE_TASK', 
  payload: {
    ...task,
    status: 'completed',
    completedAt: new Date()
  }
});
```

### ❌ Incorrect State Update
```typescript
// Wrong: Direct state modification
setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));

// Wrong: Wrong action type
dispatch({ type: 'COMPLETE_TASK', payload: taskId });
```

## Testing Standards

### Test Framework Setup
- **Framework**: Vitest with React Testing Library
- **Environment**: jsdom for DOM simulation
- **Coverage**: v8 provider with HTML/JSON/text reports
- **UI Dashboard**: Available via `npm run test:ui`

### Test File Organization
- **Component Tests**: Place next to component (`Button.tsx` → `Button.test.tsx`)
- **Utility Tests**: Place in same directory as utility (`storage.ts` → `storage.test.ts`)
- **Integration Tests**: Place in `src/tests/` with `.integration.test.tsx` suffix
- **Test Utilities**: Centralized in `src/tests/test-utils.tsx`

### Writing Tests (TDD Approach)
1. **RED**: Write failing test that defines expected behavior
2. **GREEN**: Write minimal code to make test pass
3. **REFACTOR**: Improve code quality while maintaining green tests

### Test Structure (AAA Pattern)
```typescript
it('should render task with correct priority', () => {
  // Arrange - Set up test data
  const task = createMockTask({ priority: 'high' });
  
  // Act - Execute the code being tested
  render(<TaskCard task={task} />);
  
  // Assert - Verify the results
  expect(screen.getByText('High Priority')).toBeInTheDocument();
});
```

### Query Priority (Accessibility First)
1. **getByRole** - Preferred (accessible to screen readers)
2. **getByLabelText** - Good for form fields
3. **getByPlaceholderText** - Acceptable for inputs
4. **getByText** - Good for content
5. **getByTestId** - Last resort (implementation detail)

### Testing User Interactions
```typescript
import userEvent from '@testing-library/user-event';

it('should call onClick when button is clicked', async () => {
  const handleClick = vi.fn();
  const user = userEvent.setup();
  
  render(<Button onClick={handleClick}>Click me</Button>);
  await user.click(screen.getByRole('button'));
  
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Testing Async Behavior
```typescript
// Use findBy for elements that appear asynchronously
const element = await screen.findByText('Loaded data');

// Use waitFor for complex async conditions
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

### Mocking Patterns
```typescript
import { vi } from 'vitest';

// Mock functions
const mockFn = vi.fn().mockReturnValue('value');
const mockAsync = vi.fn().mockResolvedValue({ data: 'test' });

// Mock modules
vi.mock('../services/api', () => ({
  fetchData: vi.fn().mockResolvedValue({ success: true })
}));
```

### Test Coverage Requirements
- **Minimum**: 80% coverage for new components
- **Required Tests**: All props, user interactions, edge cases
- **Edge Cases**: Empty states, null values, long text, past dates
- **Project Status**: 556 tests passing across 14 test suites (100% pass rate)
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
- **Best Practice Examples**: 
  - `src/utils/auth.test.ts` - Authentication testing with Web Crypto API mocking (109 tests)
  - `src/utils/validation.test.ts` - Comprehensive validation testing (79 tests)
  - `src/components/Auth/RegisterForm.test.tsx` - Form testing with password strength (57 tests)
  - **`src/components/Tasks/TaskForm.test.tsx` - Form testing with context mocking (52 tests)**
  - `src/components/Auth/LoginForm.test.tsx` - Form validation and loading states (49 tests)
  - `src/utils/storage.test.ts` - Storage utilities with TDD methodology (46 tests)
  - `src/components/UI/EmptyState.test.tsx` - UI component testing with accessibility (42 tests)
  - **`src/components/Tasks/TaskCard.test.tsx` - Component testing with dispatch assertions (32 tests)**
  - `src/components/UI/ErrorBoundary.test.tsx` - Error boundary testing patterns (31 tests)
- **Error States**: Loading, error messages, validation failures

### Testing with Context
```typescript
// Use test utilities for components that need providers
import { renderWithRouter, createMockTask } from '@/tests/test-utils';

it('should navigate on click', async () => {
  const user = userEvent.setup();
  renderWithRouter(<TaskList />);
  
  await user.click(screen.getByText('View Task'));
  // Assert navigation occurred
});
```

### Prohibited Testing Practices
- ❌ **Never test implementation details** (internal state, private methods)
- ❌ **Never use fireEvent** (use userEvent instead)
- ❌ **Never skip edge cases** (test happy path AND error cases)
- ❌ **Never use vague test names** (be descriptive and specific)
- ❌ **Never test third-party libraries** (trust they work)
- ❌ **Never write dependent tests** (each test should be independent)
- ❌ **Never use `any` type** (maintain TypeScript strictness)

### Running Tests
```bash
npm test              # Watch mode (development)
npm run test:run      # Single run (CI/CD)
npm run test:ui       # Visual dashboard
npm run test:coverage # Coverage report

# Run specific test suites
npm test -- src/utils/validation.test.ts  # Validation tests (79 tests)
npm test -- src/components/UI/Button.test.tsx  # Button tests (14 tests)
```

### Test Documentation
- **Testing Guide**: See `src/tests/README.md` for comprehensive documentation
- **Example Tests**: See `src/components/UI/Button.test.tsx` for patterns
- **Test Utilities**: See `src/tests/test-utils.tsx` for reusable helpers

## Cipher Memory System

Cipher stores project knowledge across sessions. Use `cipher_extract_and_operate_memory` correctly:

### Correct Usage
```typescript
// ✅ CORRECT - Array of declarative factual statements
{
  interaction: [
    "Task-manager project has 472 tests across 12 test suites.",
    "ErrorBoundary.test.tsx has 31 tests at 95% coverage.",
    "The createMockProps pattern provides reusable mock props."
  ],
  memoryMetadata: { projectId: "task-manager" },
  options: {
    enableBatchProcessing: true,
    useLLMDecisions: true,
    similarityThreshold: 0.9,   // High = triggers ADD for new facts
    confidenceThreshold: 0.3    // Low = allows more facts through
  }
}
```

### Common Mistakes
- ❌ **Never use single instruction strings** (`"Remember this..."`)
- ❌ **Never start facts with "User request:" or "Remember"**
- ❌ **Never skip `enableBatchProcessing: true`**
- ❌ **Never use low `similarityThreshold`** (causes NONE instead of ADD)

### Memory Events
| Event | Meaning |
|-------|---------|
| `ADD` | New memory created |
| `UPDATE` | Existing memory updated |
| `NONE` | No action (too similar or high confidence) |

### Workflow
1. **Search first**: Use `cipher_memory_search` to check existing memories
2. **Format facts**: Write declarative statements, not instructions
3. **Use array format**: Each fact as separate string in array
4. **Set options**: `enableBatchProcessing: true`, `similarityThreshold: 0.9`

## Critical Rules Summary

1. **Always use AppContext for state management**
2. **Always define TypeScript interfaces for components**
3. **Always use Tailwind CSS for styling**
4. **Always update related files when adding features**
5. **Always write tests for new components (TDD preferred)**
6. **Never modify state directly without dispatch**
7. **Never create components outside established structure**
8. **Never use custom CSS or inline styles**
9. **Always follow established naming conventions**
10. **Always use proper error handling in context hooks**
11. **Always maintain responsive design patterns**
12. **Always append new tasks to existing completed tasks - never delete or replace completed tasks**
13. **Always test user-visible behavior, not implementation details**
