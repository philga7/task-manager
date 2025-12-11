# Task Manager Testing Guide

## Overview

This guide provides comprehensive information about testing practices, standards, and examples for the Task Manager project.

## Current Test Status

### Test Statistics (as of December 2024)

```
✅ 100 tests passing (0 failures)
✅ 4 test suites
✅ 99.21% coverage on validation utilities
✅ Fast execution: 861ms total
```

### Test Breakdown

| Test Suite | Tests | Coverage | Duration | Status |
|------------|-------|----------|----------|--------|
| Validation Utilities | 79 | 99.21% | 7ms | ✅ |
| UI Components (Button) | 14 | - | 182ms | ✅ |
| React Integration | 4 | - | 92ms | ✅ |
| Setup/Config | 3 | - | 2ms | ✅ |
| **TOTAL** | **100** | - | **283ms** | ✅ |

## Testing Philosophy

### Test-Driven Development (TDD)

We follow strict TDD methodology:

1. **RED**: Write failing test that defines expected behavior
2. **GREEN**: Write minimal code to make test pass
3. **REFACTOR**: Improve code quality while maintaining green tests

### Testing Pyramid

```
        /\
       /  \      E2E Tests (Future)
      /____\
     /      \    Integration Tests (4 tests)
    /________\
   /          \  Unit Tests (96 tests)
  /____________\
```

## Test Organization

### File Structure

```
src/
├── components/
│   └── UI/
│       ├── Button.tsx
│       └── Button.test.tsx          # Component tests next to components
├── utils/
│   ├── validation.ts
│   ├── validation.test.ts           # Utility tests next to utilities
│   └── validation.test.md           # Comprehensive test documentation
└── tests/
    ├── setup.ts                     # Test configuration
    ├── setup.test.ts                # Setup verification tests
    ├── test-utils.tsx               # Reusable test utilities
    └── react-integration.test.tsx   # Integration tests
```

### Naming Conventions

- **Test Files**: `ComponentName.test.tsx` or `utilityName.test.ts`
- **Test Names**: Use "should..." pattern
  - ✅ "should return valid when task exists and belongs to same project"
  - ✅ "should error when title is empty string"
  - ❌ "test validation" (too vague)
  - ❌ "validates task" (not descriptive)

## Writing Tests

### AAA Pattern (Arrange-Act-Assert)

All tests should follow this structure:

```typescript
it('should render task with correct priority', () => {
  // Arrange - Set up test data and conditions
  const task = createMockTask({ priority: 'high' });
  
  // Act - Execute the code being tested
  render(<TaskCard task={task} />);
  
  // Assert - Verify the results
  expect(screen.getByText('High Priority')).toBeInTheDocument();
});
```

### Mock Data Strategy

**✅ DO**: Use realistic mock data generators

```typescript
const createMockTask = (overrides = {}) => ({
  id: 'task-001',
  title: 'Test Task',
  description: 'Test task description',
  priority: 'medium',
  status: 'todo',
  createdAt: new Date('2024-01-01'),
  tags: [],
  ...overrides,
});

// Usage
const task = createMockTask({ priority: 'high', status: 'completed' });
```

**❌ DON'T**: Use hardcoded empty arrays or placeholder data

```typescript
// Bad - unrealistic data
const task = { id: '', title: '', tags: [] };
```

### Edge Case Testing

Always test edge cases:

#### String Handling
- ✅ Empty strings (`''`)
- ✅ Whitespace-only strings (`'   '`)
- ✅ Very long strings (5000+ characters)
- ✅ Special characters (`<script>`, quotes, symbols)
- ✅ Unicode characters (emoji 🚀, Chinese 中文, Cyrillic Русский)

#### Array Handling
- ✅ Empty arrays (`[]`)
- ✅ Undefined arrays (`undefined`)
- ✅ Arrays with non-existent IDs
- ✅ Arrays with duplicate values

#### Date Handling
- ✅ Past dates
- ✅ Future dates
- ✅ Missing dates (optional fields)
- ✅ Invalid date formats

#### Boundary Values
- ✅ Minimum values (0, empty)
- ✅ Maximum values (100, very long)
- ✅ Invalid values (-10, 150)

### Comprehensive Assertions

**✅ DO**: Check multiple aspects of the result

```typescript
expect(result.isValid).toBe(false);
expect(result.errors).toHaveLength(1);
expect(result.errors[0].field).toBe('title');
expect(result.errors[0].message).toBe('Task title is required');
expect(result.errors[0].severity).toBe('error');
```

**❌ DON'T**: Use vague assertions

```typescript
expect(result).toBeTruthy();  // Too vague
expect(result.errors.length > 0).toBe(true);  // Not specific enough
```

## Test Categories

### Happy Path Tests

Test the expected, successful scenarios:

```typescript
describe('Happy Path - Valid Data', () => {
  it('should return valid for properly structured task', () => {
    const task = createMockTask();
    const result = validateTaskData(task);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
```

### Error Cases

Test invalid inputs and error handling:

```typescript
describe('Error Cases - Invalid Data', () => {
  it('should error when title is empty', () => {
    const task = createMockTask({ title: '' });
    const result = validateTaskData(task);
    expect(result.isValid).toBe(false);
    expect(result.errors[0].message).toBe('Task title is required');
  });
});
```

### Warning Cases

Test scenarios that generate warnings:

```typescript
describe('Warning Cases', () => {
  it('should warn when due date is in the past', () => {
    const task = createMockTask({ dueDate: new Date('2020-01-01') });
    const result = validateTaskData(task);
    expect(result.isValid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
```

### Edge Cases

Test unusual or extreme scenarios:

```typescript
describe('Edge Cases', () => {
  it('should handle unicode characters in titles', () => {
    const task = createMockTask({ title: '✅ Task 任务 Задача 🚀' });
    const result = validateTaskData(task);
    expect(result).toBeDefined();
    expect(result.isValid).toBe(true);
  });
});
```

## Best Practices

### Query Priority (React Testing Library)

Use queries in this order of preference:

1. **`getByRole`** - Preferred (accessible to screen readers)
   ```typescript
   screen.getByRole('button', { name: /submit/i })
   ```

2. **`getByLabelText`** - Good for form fields
   ```typescript
   screen.getByLabelText('Email address')
   ```

3. **`getByPlaceholderText`** - Acceptable for inputs
   ```typescript
   screen.getByPlaceholderText('Enter task title')
   ```

4. **`getByText`** - Good for content
   ```typescript
   screen.getByText('Task completed')
   ```

5. **`getByTestId`** - Last resort (implementation detail)
   ```typescript
   screen.getByTestId('task-card-123')
   ```

### User Interactions

Always use `userEvent` instead of `fireEvent`:

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

### Async Testing

Use `findBy` queries for async elements:

```typescript
// Wait for element to appear
const element = await screen.findByText('Loaded data');

// Or use waitFor for complex conditions
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

### Mocking

Mock external dependencies appropriately:

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

## Running Tests

### Basic Commands

```bash
# Watch mode (development)
npm test

# Single run (CI/CD)
npm run test:run

# Visual dashboard
npm run test:ui

# Coverage report
npm run test:coverage
```

### Running Specific Tests

```bash
# Run validation tests only
npm test -- src/utils/validation.test.ts

# Run Button tests only
npm test -- src/components/UI/Button.test.tsx

# Run tests matching pattern
npm test -- --grep "should validate"
```

### Coverage Reports

After running `npm run test:coverage`, view reports:

- **HTML**: `coverage/index.html` (open in browser)
- **JSON**: `coverage/coverage-final.json`
- **Text**: Displayed in terminal

## Example Test Suites

### Validation Utilities (Gold Standard)

The validation test suite (`src/utils/validation.test.ts`) is the gold standard for testing in this project:

- **79 tests** covering 8 functions
- **99.21% coverage**
- **Comprehensive edge cases**
- **Excellent documentation** (`src/utils/validation.test.md`)

Key features:
- Realistic mock data generators
- Organized describe blocks (Happy Path, Error Cases, Warning Cases, Edge Cases)
- Comprehensive assertions
- Edge case coverage (unicode, special chars, boundary values)
- Clear inline documentation

### UI Component Testing

See `src/components/UI/Button.test.tsx` for component testing patterns:

- Testing variants and sizes
- User interaction testing
- Accessibility testing
- Disabled state handling
- Custom className application

## Coverage Requirements

### Minimum Standards

- **New Components**: 80% minimum coverage
- **Critical Utilities**: 95%+ coverage recommended
- **All Functions**: 100% function coverage target

### What to Test

✅ **DO Test**:
- All public methods/functions
- User interactions
- Error conditions
- Edge cases
- Accessibility features

❌ **DON'T Test**:
- Third-party libraries
- Implementation details (internal state, private methods)
- Trivial getters/setters
- Configuration files

## Anti-Patterns to Avoid

### Testing Anti-Patterns

- ❌ Hardcoded empty arrays as test data
- ❌ Testing implementation details
- ❌ Vague test names
- ❌ Missing edge cases
- ❌ Insufficient assertions
- ❌ Tests that depend on each other
- ❌ Using `any` type in tests
- ❌ Skipping error state testing

### Code Anti-Patterns

```typescript
// ❌ Bad - Testing internal state
expect(component.state.isValid).toBe(false);

// ✅ Good - Testing user-visible behavior
expect(screen.getByText('Validation error')).toBeInTheDocument();

// ❌ Bad - Vague test name
it('test validation', () => { ... });

// ✅ Good - Descriptive test name
it('should error when title is empty string', () => { ... });

// ❌ Bad - Hardcoded data
const task = { id: '', title: '', tags: [] };

// ✅ Good - Realistic mock data
const task = createMockTask({ title: 'Real Task Title' });
```

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "Cannot find module"
**Solution**: Check import paths and ensure files exist

**Issue**: Async tests timeout
**Solution**: Increase timeout or use `await` with `findBy` queries

**Issue**: Tests pass locally but fail in CI
**Solution**: Check for timezone issues, random data, or race conditions

**Issue**: Low coverage despite many tests
**Solution**: Check for untested edge cases and error paths

### Debugging Tests

```bash
# Run tests in debug mode
npm test -- --inspect-brk

# Run single test file with verbose output
npm test -- src/utils/validation.test.ts --reporter=verbose

# Run with UI dashboard for visual debugging
npm run test:ui
```

## Contributing

When adding new tests:

1. Follow TDD methodology (RED-GREEN-REFACTOR)
2. Use realistic mock data generators
3. Cover happy path, errors, warnings, and edge cases
4. Write descriptive test names
5. Add inline comments for complex logic
6. Update this guide if introducing new patterns
7. Ensure all tests pass before committing

## Resources

### Internal Documentation

- **Validation Testing**: `src/utils/validation.test.md`
- **Test Utilities**: `src/tests/test-utils.tsx`
- **Example Tests**: `src/components/UI/Button.test.tsx`
- **Project Standards**: `shrimp-rules.md`
- **Agent Guidelines**: `agents.md`

### External Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [User Event API](https://testing-library.com/docs/user-event/intro)

---

**Last Updated**: December 2024  
**Test Count**: 100 tests  
**Coverage**: 99.21% (validation utilities)  
**Status**: ✅ All tests passing
