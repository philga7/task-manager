# Testing Quick Reference Card

## 🚀 Quick Start

```bash
npm test                    # Watch mode
npm run test:run            # Single run
npm run test:ui             # Visual dashboard
npm run test:coverage       # Coverage report
```

## 📊 Current Status

```
✅ 100 tests passing
✅ 99.21% coverage (validation)
✅ 4 test suites
✅ 283ms execution time
```

## 🎯 TDD Cycle

1. **RED** → Write failing test
2. **GREEN** → Make it pass
3. **REFACTOR** → Improve code

## 📝 Test Structure (AAA)

```typescript
it('should do something', () => {
  // Arrange - Setup
  const data = createMockData();
  
  // Act - Execute
  const result = functionUnderTest(data);
  
  // Assert - Verify
  expect(result).toBe(expected);
});
```

## 🏗️ Mock Data

```typescript
// ✅ DO - Realistic data
const task = createMockTask({ 
  priority: 'high',
  status: 'completed' 
});

// ❌ DON'T - Empty placeholders
const task = { id: '', title: '' };
```

## 🔍 Query Priority

1. `getByRole` ⭐ (accessibility)
2. `getByLabelText` (forms)
3. `getByPlaceholderText` (inputs)
4. `getByText` (content)
5. `getByTestId` (last resort)

## 🖱️ User Interactions

```typescript
import userEvent from '@testing-library/user-event';

const user = userEvent.setup();
await user.click(button);
await user.type(input, 'text');
await user.keyboard('{Enter}');
```

## ⏱️ Async Testing

```typescript
// Wait for element
const element = await screen.findByText('Loaded');

// Wait for condition
await waitFor(() => {
  expect(screen.getByText('Done')).toBeInTheDocument();
});
```

## 🧪 Test Categories

### Happy Path
```typescript
describe('Happy Path', () => {
  it('should work with valid data', () => {
    // Test successful scenarios
  });
});
```

### Error Cases
```typescript
describe('Error Cases', () => {
  it('should error when invalid', () => {
    // Test error handling
  });
});
```

### Edge Cases
```typescript
describe('Edge Cases', () => {
  it('should handle unicode 🚀中文', () => {
    // Test unusual scenarios
  });
});
```

## 🎨 Edge Cases Checklist

### Strings
- [ ] Empty string (`''`)
- [ ] Whitespace only (`'   '`)
- [ ] Very long (5000+ chars)
- [ ] Special chars (`<script>`)
- [ ] Unicode (🚀, 中文, Русский)

### Arrays
- [ ] Empty array (`[]`)
- [ ] Undefined (`undefined`)
- [ ] Non-existent IDs
- [ ] Duplicates

### Dates
- [ ] Past dates
- [ ] Future dates
- [ ] Missing (optional)
- [ ] Invalid formats

### Numbers
- [ ] Zero (`0`)
- [ ] Negative (`-10`)
- [ ] Maximum (`100`)
- [ ] Over limit (`150`)

## ✅ Comprehensive Assertions

```typescript
// ✅ Good - Multiple checks
expect(result.isValid).toBe(false);
expect(result.errors).toHaveLength(1);
expect(result.errors[0].field).toBe('title');
expect(result.errors[0].message).toBe('Required');

// ❌ Bad - Vague
expect(result).toBeTruthy();
```

## 🚫 Anti-Patterns

- ❌ Hardcoded empty arrays
- ❌ Testing implementation details
- ❌ Vague test names
- ❌ Missing edge cases
- ❌ Dependent tests
- ❌ Using `any` type
- ❌ Skipping error states

## 📚 Examples

### Validation Tests
`src/utils/validation.test.ts`
- 79 tests, 99.21% coverage
- Gold standard example

### Component Tests
`src/components/UI/Button.test.tsx`
- 14 tests
- UI testing patterns

## 🎓 Best Practices

1. **Realistic Data** - Use mock generators
2. **Descriptive Names** - "should..." pattern
3. **AAA Pattern** - Arrange-Act-Assert
4. **Edge Cases** - Test extremes
5. **Accessibility** - Use getByRole
6. **User Events** - Use userEvent
7. **Async** - Use findBy/waitFor
8. **Documentation** - Comment complex logic

## 📖 Full Documentation

- **Complete Guide**: `docs/TESTING_GUIDE.md`
- **Validation Tests**: `src/utils/validation.test.md`
- **Test Utilities**: `src/tests/test-utils.tsx`
- **Project Rules**: `shrimp-rules.md`

## 🎯 Coverage Goals

- **New Components**: 80% minimum
- **Critical Utils**: 95%+ recommended
- **Functions**: 100% target

## 🔧 Debugging

```bash
# Debug mode
npm test -- --inspect-brk

# Verbose output
npm test -- --reporter=verbose

# Visual debugging
npm run test:ui
```

---

**Quick Tip**: When in doubt, look at `validation.test.ts` for examples! 🚀
