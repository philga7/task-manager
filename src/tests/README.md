# Testing Guide for Task Manager

## Overview

This project uses **Vitest** as the testing framework with **React Testing Library** for component testing. The setup follows Test-Driven Development (TDD) principles and best practices.

## Table of Contents

- [Quick Start](#quick-start)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Testing Patterns](#testing-patterns)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

All testing dependencies are already installed. If you need to reinstall:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui
```

### Running Tests

```bash
# Run tests in watch mode (recommended for development)
npm test

# Run tests once (CI/CD mode)
npm run test:run

# Run tests with UI dashboard
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
src/
├── tests/
│   ├── setup.ts              # Global test setup
│   ├── test-utils.tsx        # Reusable test utilities
│   ├── setup.test.ts         # Vitest configuration tests
│   └── react-integration.test.tsx  # React integration tests
└── components/
    └── UI/
        ├── Button.tsx
        └── Button.test.tsx   # Component tests live next to components
```

## Writing Tests

### Test File Naming

- Component tests: `ComponentName.test.tsx`
- Utility tests: `utilityName.test.ts`
- Integration tests: `feature.integration.test.tsx`

### Basic Test Structure (AAA Pattern)

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    // Arrange - Set up test data and conditions
    const props = { title: 'Test Title' };
    
    // Act - Execute the code being tested
    render(<MyComponent {...props} />);
    
    // Assert - Verify the results
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });
});
```

### Testing User Interactions

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Interactive Component', () => {
  it('should handle button clicks', async () => {
    // Arrange
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    // Act
    await user.click(screen.getByRole('button'));
    
    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testing Async Behavior

```typescript
import { waitFor } from '@testing-library/react';

it('should load data asynchronously', async () => {
  render(<AsyncComponent />);
  
  // Wait for element to appear
  const element = await screen.findByText('Loaded data');
  expect(element).toBeInTheDocument();
  
  // Or use waitFor for complex conditions
  await waitFor(() => {
    expect(screen.getByText('Loaded data')).toBeInTheDocument();
  });
});
```

## Testing Patterns

### 1. Query Priority (Accessibility First)

Use queries in this order of preference:

```typescript
// ✅ Best - Accessible to everyone
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText('Email address')

// ✅ Good - Semantic queries
screen.getByPlaceholderText('Enter email')
screen.getByText('Welcome')

// ⚠️ Last resort - Implementation detail
screen.getByTestId('submit-button')
```

### 2. Testing Component Variants

```typescript
describe('Button variants', () => {
  it.each([
    ['primary', 'text-white'],
    ['secondary', 'bg-stone-800'],
    ['ghost', 'text-stone-400'],
  ])('should apply %s variant classes', (variant, expectedClass) => {
    render(<Button variant={variant}>Button</Button>);
    expect(screen.getByRole('button')).toHaveClass(expectedClass);
  });
});
```

### 3. Testing Forms

```typescript
it('should submit form with valid data', async () => {
  const handleSubmit = vi.fn();
  const user = userEvent.setup();
  
  render(<TaskForm onSubmit={handleSubmit} />);
  
  // Fill out form
  await user.type(screen.getByLabelText('Title'), 'New Task');
  await user.selectOptions(screen.getByLabelText('Priority'), 'high');
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  // Verify submission
  expect(handleSubmit).toHaveBeenCalledWith({
    title: 'New Task',
    priority: 'high',
  });
});
```

### 4. Testing with AppContext

```typescript
// TODO: Implement when testing components that use useApp()
// This will require creating a mock AppContext provider

import { renderWithAppContext } from '../tests/test-utils';

it('should display tasks from context', () => {
  const mockState = {
    tasks: [{ id: '1', title: 'Test Task' }],
  };
  
  renderWithAppContext(<TaskList />, { initialState: mockState });
  
  expect(screen.getByText('Test Task')).toBeInTheDocument();
});
```

## Best Practices

### ✅ DO

1. **Test behavior, not implementation**
   ```typescript
   // ✅ Good - Tests user-visible behavior
   expect(screen.getByText('Task completed')).toBeInTheDocument();
   
   // ❌ Bad - Tests implementation detail
   expect(component.state.isCompleted).toBe(true);
   ```

2. **Use descriptive test names**
   ```typescript
   // ✅ Good
   it('should disable submit button when form is invalid', () => {});
   
   // ❌ Bad
   it('button test', () => {});
   ```

3. **Test edge cases**
   ```typescript
   describe('TaskCard', () => {
     it('should render with required props');
     it('should render with optional props');
     it('should handle missing description gracefully');
     it('should handle very long titles');
     it('should handle past due dates');
   });
   ```

4. **Use userEvent over fireEvent**
   ```typescript
   // ✅ Good - Simulates real user interaction
   await userEvent.click(button);
   
   // ❌ Bad - Low-level DOM event
   fireEvent.click(button);
   ```

5. **Mock external dependencies**
   ```typescript
   import { vi } from 'vitest';
   
   vi.mock('../services/emailService', () => ({
     sendEmail: vi.fn().mockResolvedValue({ success: true }),
   }));
   ```

### ❌ DON'T

1. **Don't test implementation details**
2. **Don't use snapshots for everything** (they're brittle)
3. **Don't test third-party libraries** (trust they work)
4. **Don't write tests that depend on each other**
5. **Don't use `any` type in test files**

## Common Patterns

### Mocking Functions

```typescript
import { vi } from 'vitest';

const mockFn = vi.fn();
mockFn.mockReturnValue('mocked value');
mockFn.mockResolvedValue('async value');
mockFn.mockRejectedValue(new Error('error'));

expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFn).toHaveBeenCalledTimes(3);
```

### Testing Error States

```typescript
it('should display error message on failure', async () => {
  const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
  
  render(<DataLoader fetchData={mockFetch} />);
  
  await waitFor(() => {
    expect(screen.getByText(/network error/i)).toBeInTheDocument();
  });
});
```

### Testing Loading States

```typescript
it('should show loading spinner while fetching', async () => {
  render(<AsyncComponent />);
  
  // Loading state
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  
  // Wait for data to load
  await screen.findByText('Data loaded');
  
  // Loading state should be gone
  expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
});
```

## Custom Matchers

Available from `@testing-library/jest-dom`:

```typescript
// DOM presence
expect(element).toBeInTheDocument();
expect(element).toBeVisible();
expect(element).toBeEmptyDOMElement();

// Form elements
expect(input).toHaveValue('text');
expect(checkbox).toBeChecked();
expect(button).toBeDisabled();

// Text content
expect(element).toHaveTextContent('text');
expect(element).toContainHTML('<span>text</span>');

// Attributes
expect(element).toHaveAttribute('href', '/path');
expect(element).toHaveClass('active');
expect(element).toHaveStyle({ color: 'red' });
```

## Test Coverage

Generate coverage reports:

```bash
npm run test:coverage
```

Coverage reports are generated in `coverage/` directory:
- `coverage/index.html` - HTML report (open in browser)
- `coverage/coverage-final.json` - JSON report (for CI/CD)

### Coverage Thresholds

Current configuration excludes:
- `node_modules/`
- `src/tests/`
- `*.config.ts`
- `dist/`

## Troubleshooting

### Tests fail with "Cannot find module"

**Solution:** Check that imports use correct paths and file extensions.

### "ReferenceError: window is not defined"

**Solution:** Ensure `vitest.config.ts` has `environment: 'jsdom'`.

### Custom matchers not working

**Solution:** Import `@testing-library/jest-dom/vitest` in test file or setup.

### Tests pass locally but fail in CI

**Solution:** Check for:
- Timezone differences (use UTC in tests)
- File system case sensitivity
- Missing environment variables

### Slow tests

**Solution:**
- Use `vi.mock()` for expensive operations
- Avoid unnecessary `waitFor()` calls
- Use `screen.getBy*` instead of `screen.findBy*` when possible

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Examples

See these files for complete examples:
- `src/tests/setup.test.ts` - Basic Vitest tests
- `src/tests/react-integration.test.tsx` - React component tests
- `src/components/UI/Button.test.tsx` - Real-world component testing

---

**Happy Testing! 🧪**

Remember: Good tests give you confidence to refactor and add features without breaking existing functionality.

