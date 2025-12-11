# Storage Utilities Test Documentation

## Overview

This document provides comprehensive documentation for the storage utilities test suite (`storage.test.ts`). The test suite validates critical functionality for data persistence, demo mode isolation, and error handling in the Task Manager application.

## Test Philosophy

This test suite follows **Test-Driven Development (TDD)** methodology:
- **RED**: Write failing tests first to define expected behavior
- **GREEN**: Implement minimal code to make tests pass
- **REFACTOR**: Improve code quality while maintaining green tests

## Critical Context

### Historical Bug Fixes Validated
1. **Demo Mode Data Leakage** (Task `9f78e309-578d-46fb-a51b-e77b1961b764`)
   - Issue: Demo mode surfaced real user data due to state and storage key mix-ups
   - Solution: Namespace isolation with `demo:` prefix
   - Tests: Group 6 (Namespace Isolation) - 5 tests

2. **iPhone Safari Compatibility** (Task `3a38bbe8-c839-4015-a071-1ceb10e3b06a`)
   - Issue: Hidden tasks on iPhone Safari due to storage access failures
   - Solution: Mobile browser detection and fallback strategies
   - Tests: Mobile compatibility tests in saveToStorage/loadFromStorage

3. **Authentication State Corruption** (Task `4e3428a6-1157-44c4-bbd4-6a1ccd187155`)
   - Issue: Users needed to log into demo mode first after deployment
   - Solution: Deployment-aware validation and corruption detection
   - Tests: Data validation tests in loadFromStorage

## Test Suite Structure

### Total Tests: 46
- **Date Serialization/Deserialization**: 6 tests
- **serializeState()**: 4 tests
- **deserializeState()**: 5 tests
- **saveToStorage()**: 6 tests
- **loadFromStorage()**: 6 tests
- **Namespace Isolation**: 5 tests (CRITICAL for demo mode)
- **clearStorage()**: 2 tests
- **Utility Functions**: 4 tests
- **Edge Cases & Error Handling**: 5 tests
- **Integration Tests**: 3 tests

## Test Groups

### Group 1: Date Serialization/Deserialization (6 tests)

**Purpose**: Validates that Date objects are properly serialized to ISO strings and deserialized back to Date objects.

**Why It Matters**: Tasks, projects, and goals have Date fields (createdAt, dueDate, targetDate). Incorrect serialization causes data corruption.

**Tests**:
1. ✅ Serialize Date objects to ISO string format
2. ✅ Deserialize ISO strings back to Date objects
3. ✅ Handle nested Date objects in arrays
4. ✅ Handle nested Date objects in objects
5. ✅ Handle null and undefined values
6. ✅ Preserve non-Date values unchanged

**Example**:
```typescript
const task = { createdAt: new Date('2024-01-15T10:30:00.000Z') };
const serialized = serializeState(task);
// Result: { createdAt: { __type: 'Date', value: '2024-01-15T10:30:00.000Z' } }
```

### Group 2: serializeState() (4 tests)

**Purpose**: Tests state serialization to JSON with proper error handling.

**Tests**:
1. ✅ Serialize valid AppState to JSON string
2. ✅ Handle AppState with Date objects
3. ✅ Handle empty arrays and objects
4. ✅ Handle null state gracefully

**Edge Cases**:
- Empty collections ([], {})
- Null/undefined values
- Complex nested structures

### Group 3: deserializeState() (5 tests)

**Purpose**: Tests state deserialization from JSON with validation.

**Tests**:
1. ✅ Deserialize valid JSON to AppState
2. ✅ Restore Date objects from serialized format
3. ✅ Throw error for missing required properties
4. ✅ Throw error for invalid JSON
5. ✅ Throw error for corrupted data structure

**Validation Rules**:
- Must have all required properties: tasks, projects, goals, analytics, userSettings, authentication
- Must be valid JSON
- Must be an object (not string, array, etc.)

### Group 4: saveToStorage() (6 tests)

**Purpose**: Tests saving data to localStorage with mobile browser compatibility.

**Tests**:
1. ✅ Save data to localStorage successfully
2. ✅ Apply namespace prefix in demo mode
3. ✅ Throw error when data exceeds 5MB limit
4. ✅ Throw error on QuotaExceededError
5. ✅ Use sessionStorage fallback when localStorage fails
6. ✅ Handle mobile browser compatibility

**Size Limits**:
- Maximum data size: 5MB
- Throws error if exceeded
- Automatically calculates size using Blob

**Fallback Strategy**:
1. Try localStorage (primary)
2. Try sessionStorage (fallback)
3. Throw error if both fail

### Group 5: loadFromStorage() (6 tests)

**Purpose**: Tests loading data from storage with fallback strategies.

**Tests**:
1. ✅ Load data from localStorage successfully
2. ✅ Return null when key doesn't exist
3. ✅ Handle namespaced keys in demo mode
4. ✅ Clear corrupted data and return null
5. ✅ Try fallback storage methods
6. ✅ Validate data for deployment compatibility

**Recovery Behavior**:
- Corrupted data is automatically cleared
- Returns null instead of throwing error
- Logs warnings for debugging

### Group 6: Namespace Isolation (5 tests) ⚠️ CRITICAL

**Purpose**: Validates complete isolation between demo mode and real user data.

**Why It's Critical**: This prevents the demo mode data leakage bug (Task `9f78e309`).

**Tests**:
1. ✅ Add "demo:" prefix in demo mode
2. ✅ Not add prefix in normal mode
3. ✅ Isolate demo data from real user data
4. ✅ Prevent cross-contamination between modes
5. ✅ Handle namespace switching correctly

**Namespace Rules**:
- Demo mode: `demo:task-manager-state`
- Normal mode: `task-manager-state`
- Never mix data between namespaces

**Example**:
```typescript
// Real user data
sessionStorage.setItem('task_manager_session', JSON.stringify({ isDemoMode: false }));
saveToStorage('task-manager-state', realState);
// Saved to: 'task-manager-state'

// Demo mode data
sessionStorage.setItem('task_manager_session', JSON.stringify({ isDemoMode: true }));
saveToStorage('task-manager-state', demoState);
// Saved to: 'demo:task-manager-state'
```

### Group 7: clearStorage() (2 tests)

**Purpose**: Tests storage clearing functionality.

**Tests**:
1. ✅ Clear specific namespaced key
2. ✅ Throw error on failure

### Group 8: Utility Functions (4 tests)

**Purpose**: Tests helper functions for storage management.

**Tests**:
1. ✅ Check if storage is available
2. ✅ Calculate storage size for specific key
3. ✅ Return 0 for non-existent keys
4. ✅ Calculate total storage size

**Use Cases**:
- Check storage availability before operations
- Monitor storage usage
- Warn users when approaching limits

### Group 9: Edge Cases & Error Handling (5 tests)

**Purpose**: Tests unusual scenarios and error conditions.

**Tests**:
1. ✅ Handle empty string data
2. ✅ Handle whitespace-only data
3. ✅ Handle very large data (near 5MB limit)
4. ✅ Handle concurrent save operations
5. ✅ Handle storage quota exceeded gracefully

**Edge Cases Covered**:
- Empty/whitespace data
- Very large data (10,000 tasks)
- Concurrent operations
- Storage quota exceeded
- Corrupted data

### Group 10: Integration Tests (3 tests)

**Purpose**: Tests complete workflows and interactions between functions.

**Tests**:
1. ✅ Successfully save and load complete application state
2. ✅ Maintain data integrity through multiple save/load cycles
3. ✅ Maintain complete isolation between demo and real data

**Workflow Tested**:
```
Save → Load → Verify → Repeat 5x → Verify Integrity
```

## Mock Data Strategy

Following the exemplary pattern from `validation.test.ts`, all tests use realistic mock data:

```typescript
const createMockTask = (overrides = {}) => ({
  id: 'task-001',
  title: 'Test Task',
  priority: 'medium',
  status: 'todo',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  tags: [],
  ...overrides,
});
```

**Benefits**:
- ✅ Realistic data structure
- ✅ Easy to customize with overrides
- ✅ Consistent across tests
- ✅ Matches production data

## Storage Mocking

All tests use a custom `StorageMock` class that implements the `Storage` interface:

```typescript
class StorageMock implements Storage {
  private store: Record<string, string> = {};
  
  getItem(key: string): string | null { ... }
  setItem(key: string, value: string): void { ... }
  removeItem(key: string): void { ... }
  clear(): void { ... }
  key(index: number): string | null { ... }
  get length(): number { ... }
}
```

**Benefits**:
- ✅ Complete isolation from real storage
- ✅ No side effects between tests
- ✅ Predictable behavior
- ✅ Easy to mock errors

## Console Output Management

To reduce noise during testing, expected errors and warnings are suppressed:

```typescript
beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
```

**Why**: Many tests intentionally trigger errors to verify error handling. These are expected and should not clutter test output.

**What's Suppressed**:
- ❌ Expected deserialization errors
- ❌ Expected storage quota errors
- ⚠️ Expected validation warnings
- ⚠️ Expected corruption warnings

**What's NOT Suppressed**:
- ℹ️ INFO logs (helpful for debugging)
- ✅ Test results
- ❌ Unexpected errors (test failures)

## Coverage Goals

**Target**: 80%+ coverage for storage utilities

**Current Status**: 46/46 tests passing (100%)

**Coverage Areas**:
- ✅ Date serialization/deserialization
- ✅ State serialization/deserialization
- ✅ Storage operations (save/load/clear)
- ✅ Namespace isolation
- ✅ Error handling
- ✅ Edge cases
- ✅ Integration workflows

## Running Tests

```bash
# Run storage tests only
npm test -- src/utils/storage.test.ts

# Run with verbose output
npm test -- src/utils/storage.test.ts --reporter=verbose

# Run with coverage
npm run test:coverage -- src/utils/storage.test.ts

# Run in watch mode (development)
npm test -- src/utils/storage.test.ts --watch
```

## Debugging Tests

### Common Issues

**Issue**: Tests fail with "localStorage is not defined"
**Solution**: The test setup includes localStorage mocking. Check `beforeEach` setup.

**Issue**: Date objects not matching
**Solution**: Use ISO string comparison: `date.toISOString()`

**Issue**: Namespace tests failing
**Solution**: Ensure `task_manager_session` is set in sessionStorage before test.

### Debug Tips

1. **Check storage state**:
```typescript
console.log('localStorage:', Object.keys(localStorage));
console.log('sessionStorage:', Object.keys(sessionStorage));
```

2. **Verify namespace**:
```typescript
console.log('isDemoMode:', isDemoMode());
console.log('namespaced key:', getNamespacedKey('test-key'));
```

3. **Inspect serialized data**:
```typescript
const serialized = serializeState(state);
console.log('serialized:', JSON.parse(serialized));
```

## Maintenance Guidelines

### Adding New Tests

1. **Follow AAA Pattern**:
   - Arrange: Set up test data
   - Act: Execute function
   - Assert: Verify results

2. **Use Descriptive Names**:
   ```typescript
   it('should add "demo:" prefix in demo mode', () => { ... });
   ```

3. **Group Related Tests**:
   ```typescript
   describe('Namespace Isolation', () => {
     describe('Demo Mode Namespace', () => { ... });
   });
   ```

4. **Use Mock Data Generators**:
   ```typescript
   const task = createMockTask({ title: 'Custom Title' });
   ```

### Updating Existing Tests

1. **Check dependencies**: Ensure changes don't break other tests
2. **Update documentation**: Keep this file in sync with tests
3. **Run full suite**: `npm test -- src/utils/storage.test.ts`
4. **Verify coverage**: Ensure coverage doesn't drop

### When Storage.ts Changes

1. **Update tests first** (TDD approach)
2. **Run tests to see failures** (RED phase)
3. **Update implementation** (GREEN phase)
4. **Refactor if needed** (REFACTOR phase)
5. **Update documentation**

## Best Practices

### ✅ DO

- Use realistic mock data
- Test edge cases (empty, null, large data)
- Test error conditions
- Use descriptive test names
- Group related tests
- Mock external dependencies
- Clean up after each test

### ❌ DON'T

- Use hardcoded empty arrays as test data
- Test implementation details
- Skip edge cases
- Use vague test names
- Create dependent tests
- Use real localStorage in tests
- Leave side effects between tests

## Related Documentation

- **Testing Guide**: `src/tests/README.md`
- **Validation Tests**: `src/utils/validation.test.ts` (exemplary pattern)
- **Storage Implementation**: `src/utils/storage.ts`
- **Project Standards**: `shrimp-rules.md`
- **AI Agent Guidelines**: `agents.md`

## Changelog

### 2025-12-10 - Initial Creation
- Created comprehensive test suite with 46 tests
- Implemented TDD methodology (RED-GREEN-REFACTOR)
- Added namespace isolation tests for demo mode
- Added mobile browser compatibility tests
- Added edge case and error handling tests
- Added integration tests for complete workflows
- Achieved 100% test pass rate (46/46)

---

**Last Updated**: 2025-12-10
**Test Count**: 46 tests
**Pass Rate**: 100%
**Coverage Target**: 80%+
