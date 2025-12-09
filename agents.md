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
- **Test Location**: Component tests live next to components (`ComponentName.test.tsx`)
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
```

### Test Coverage Requirements
- **Minimum Coverage**: 80% for new components
- **Required Tests**: All public component props and user interactions
- **Excluded from Coverage**: Test files, config files, types-only files

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

### Prohibited Testing Practices
- **NEVER** test third-party libraries (trust they work)
- **NEVER** use snapshots as the primary testing method
- **NEVER** write tests that depend on each other
- **NEVER** use `any` type in test files
- **NEVER** skip testing error states and edge cases
- **NEVER** test implementation details (internal state, private methods)

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

---

This document provides comprehensive guidance for AI agents working on the Task Manager project. Follow these guidelines to ensure consistent, high-quality development that maintains the application's reliability and user experience.
