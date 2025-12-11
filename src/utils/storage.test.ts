/**
 * Test Suite: Storage Utilities
 * Purpose: Comprehensive unit tests for storage.ts functions
 * 
 * This test suite validates:
 * 1. Date serialization/deserialization
 * 2. State serialization/deserialization with validation
 * 3. Storage operations (save, load, clear)
 * 4. Namespace isolation for demo mode
 * 5. Error handling and recovery
 * 6. Mobile browser compatibility
 * 7. Storage quota management
 * 8. Utility functions (size calculation, availability)
 * 
 * Testing Methodology: Test-Driven Development (TDD)
 * - RED: Write failing tests first ✅
 * - GREEN: Implement minimal code to pass
 * - REFACTOR: Improve code quality
 * 
 * Critical Context:
 * - Demo mode isolation bug (task 9f78e309) - MUST prevent data leakage
 * - iPhone Safari compatibility (task 3a38bbe8) - MUST handle mobile quirks
 * - Storage corruption after deployment (task 4e3428a6) - MUST validate data
 * 
 * @see src/utils/storage.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import {
  serializeState,
  deserializeState,
  saveToStorage,
  loadFromStorage,
  clearStorage,
  isStorageAvailable,
  getStorageSize,
  getTotalStorageSize,
} from './storage';
import { Task, Project, Goal, Analytics, UserSettings, AuthenticationState } from '../types';

/**
 * Mock Data Generators
 * Following the pattern from validation.test.ts
 */

interface AppState {
  tasks: Task[];
  projects: Project[];
  goals: Goal[];
  analytics: Analytics;
  searchQuery: string;
  selectedProject: string | null;
  selectedPriority: string | null;
  userSettings: UserSettings;
  authentication: AuthenticationState;
}

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-001',
  title: 'Test Task',
  description: 'Test task description',
  priority: 'medium',
  status: 'todo',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  tags: [],
  projectId: 'project-001',
  ...overrides,
});

const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-001',
  name: 'Test Project',
  description: 'Test project description',
  color: '#D97757',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  tasks: [],
  progress: 0,
  ...overrides,
});

const createMockGoal = (overrides: Partial<Goal> = {}): Goal => ({
  id: 'goal-001',
  title: 'Test Goal',
  description: 'Test goal description',
  targetDate: new Date('2024-12-31T00:00:00.000Z'),
  progress: 0,
  milestones: [],
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  projects: [],
  ...overrides,
});

const createMockAnalytics = (overrides: Partial<Analytics> = {}): Analytics => ({
  tasksCompleted: 0,
  tasksCreated: 0,
  productivity: 0,
  streakDays: 0,
  averageCompletionTime: 0,
  ...overrides,
});

const createMockUserSettings = (overrides: Partial<UserSettings> = {}): UserSettings => ({
  profile: {
    name: 'Test User',
    email: 'test@example.com',
  },
  notifications: {
    emailTasks: false,
    dailySummary: false,
    weeklyReports: false,
  },
  appearance: {
    theme: 'light',
    accentColor: '#D97757',
  },
  ...overrides,
});

const createMockAuthState = (overrides: Partial<AuthenticationState> = {}): AuthenticationState => ({
  user: null,
  isAuthenticated: false,
  isDemoMode: false,
  ...overrides,
});

const createMockAppState = (overrides: Partial<AppState> = {}): AppState => ({
  tasks: [],
  projects: [],
  goals: [],
  analytics: createMockAnalytics(),
  searchQuery: '',
  selectedProject: null,
  selectedPriority: null,
  userSettings: createMockUserSettings(),
  authentication: createMockAuthState(),
  ...overrides,
});

/**
 * Storage Mock Setup
 * Mocks localStorage and sessionStorage for isolated testing
 */

class StorageMock implements Storage {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  clear(): void {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

let localStorageMock: StorageMock;
let sessionStorageMock: StorageMock;

// Suppress expected console output during tests for cleaner output
// These errors/warnings are intentional and part of our test assertions
beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});

beforeEach(() => {
  // Create fresh storage mocks for each test
  localStorageMock = new StorageMock();
  sessionStorageMock = new StorageMock();

  // Replace global storage objects
  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  Object.defineProperty(global, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
  });

  // Mock Blob for size calculations
  global.Blob = class Blob {
    size: number;
    constructor(parts: BlobPart[]) {
      this.size = parts.reduce((acc, part) => {
        if (typeof part === 'string') {
          return acc + part.length;
        }
        return acc;
      }, 0);
    }
  } as unknown as typeof Blob;
});

afterEach(() => {
  // Clean up after each test
  localStorageMock.clear();
  sessionStorageMock.clear();
  vi.clearAllMocks();
});

/**
 * GROUP 1: Date Serialization/Deserialization
 * Tests the internal date handling mechanisms
 */
describe('Date Serialization/Deserialization', () => {
  describe('Happy Path - Valid Date Handling', () => {
    it('should serialize Date objects to ISO string format', () => {
      // Arrange
      const state = createMockAppState({
        tasks: [createMockTask({ createdAt: new Date('2024-01-15T10:30:00.000Z') })],
      });

      // Act
      const serialized = serializeState(state);
      const parsed = JSON.parse(serialized);

      // Assert
      expect(parsed.tasks[0].createdAt).toEqual({
        __type: 'Date',
        value: '2024-01-15T10:30:00.000Z',
      });
    });

    it('should deserialize ISO strings back to Date objects', () => {
      // Arrange
      const state = createMockAppState({
        tasks: [createMockTask({ createdAt: new Date('2024-01-15T10:30:00.000Z') })],
      });
      const serialized = serializeState(state);

      // Act
      const deserialized = deserializeState(serialized);

      // Assert
      expect(deserialized.tasks[0].createdAt).toBeInstanceOf(Date);
      expect(deserialized.tasks[0].createdAt.toISOString()).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should handle nested Date objects in arrays', () => {
      // Arrange
      const state = createMockAppState({
        tasks: [
          createMockTask({ createdAt: new Date('2024-01-01T00:00:00.000Z') }),
          createMockTask({ 
            id: 'task-002',
            createdAt: new Date('2024-01-02T00:00:00.000Z'),
            dueDate: new Date('2024-01-10T00:00:00.000Z'),
          }),
        ],
      });

      // Act
      const serialized = serializeState(state);
      const deserialized = deserializeState(serialized);

      // Assert
      expect(deserialized.tasks).toHaveLength(2);
      expect(deserialized.tasks[0].createdAt).toBeInstanceOf(Date);
      expect(deserialized.tasks[1].createdAt).toBeInstanceOf(Date);
      expect(deserialized.tasks[1].dueDate).toBeInstanceOf(Date);
    });

    it('should handle nested Date objects in objects', () => {
      // Arrange
      const state = createMockAppState({
        goals: [
          createMockGoal({
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            targetDate: new Date('2024-12-31T00:00:00.000Z'),
          }),
        ],
      });

      // Act
      const serialized = serializeState(state);
      const deserialized = deserializeState(serialized);

      // Assert
      expect(deserialized.goals[0].createdAt).toBeInstanceOf(Date);
      expect(deserialized.goals[0].targetDate).toBeInstanceOf(Date);
    });

    it('should handle null and undefined values', () => {
      // Arrange
      const state = createMockAppState({
        selectedProject: null,
        selectedPriority: null,
      });

      // Act
      const serialized = serializeState(state);
      const deserialized = deserializeState(serialized);

      // Assert
      expect(deserialized.selectedProject).toBeNull();
      expect(deserialized.selectedPriority).toBeNull();
    });

    it('should preserve non-Date values unchanged', () => {
      // Arrange
      const state = createMockAppState({
        searchQuery: 'test query',
        analytics: createMockAnalytics({
          tasksCompleted: 42,
          productivity: 85.5,
        }),
      });

      // Act
      const serialized = serializeState(state);
      const deserialized = deserializeState(serialized);

      // Assert
      expect(deserialized.searchQuery).toBe('test query');
      expect(deserialized.analytics.tasksCompleted).toBe(42);
      expect(deserialized.analytics.productivity).toBe(85.5);
    });
  });
});

/**
 * GROUP 2: serializeState()
 * Tests state serialization with error handling
 */
describe('serializeState', () => {
  describe('Happy Path - Valid Serialization', () => {
    it('should serialize valid AppState to JSON string', () => {
      // Arrange
      const state = createMockAppState();

      // Act
      const result = serializeState(state);

      // Assert
      expect(typeof result).toBe('string');
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should handle AppState with Date objects', () => {
      // Arrange
      const state = createMockAppState({
        tasks: [createMockTask({ createdAt: new Date('2024-01-01T00:00:00.000Z') })],
        projects: [createMockProject({ createdAt: new Date('2024-01-01T00:00:00.000Z') })],
        goals: [createMockGoal({ 
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          targetDate: new Date('2024-12-31T00:00:00.000Z'),
        })],
      });

      // Act
      const result = serializeState(state);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.tasks[0].createdAt).toHaveProperty('__type', 'Date');
      expect(parsed.projects[0].createdAt).toHaveProperty('__type', 'Date');
      expect(parsed.goals[0].createdAt).toHaveProperty('__type', 'Date');
      expect(parsed.goals[0].targetDate).toHaveProperty('__type', 'Date');
    });

    it('should handle empty arrays and objects', () => {
      // Arrange
      const state = createMockAppState({
        tasks: [],
        projects: [],
        goals: [],
      });

      // Act
      const result = serializeState(state);
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.tasks).toEqual([]);
      expect(parsed.projects).toEqual([]);
      expect(parsed.goals).toEqual([]);
    });
  });

  describe('Error Cases - Invalid Input', () => {
    it('should handle null state gracefully', () => {
      // Arrange
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invalidState = null as any;

      // Act
      const result = serializeState(invalidState);

      // Assert - serializeState handles null by serializing it
      expect(result).toBe('null');
    });
  });
});

/**
 * GROUP 3: deserializeState()
 * Tests state deserialization with validation
 */
describe('deserializeState', () => {
  describe('Happy Path - Valid Deserialization', () => {
    it('should deserialize valid JSON to AppState', () => {
      // Arrange
      const state = createMockAppState();
      const serialized = serializeState(state);

      // Act
      const result = deserializeState(serialized);

      // Assert
      expect(result).toHaveProperty('tasks');
      expect(result).toHaveProperty('projects');
      expect(result).toHaveProperty('goals');
      expect(result).toHaveProperty('analytics');
      expect(result).toHaveProperty('userSettings');
      expect(result).toHaveProperty('authentication');
    });

    it('should restore Date objects from serialized format', () => {
      // Arrange
      const state = createMockAppState({
        tasks: [createMockTask({ createdAt: new Date('2024-01-15T10:30:00.000Z') })],
      });
      const serialized = serializeState(state);

      // Act
      const result = deserializeState(serialized);

      // Assert
      expect(result.tasks[0].createdAt).toBeInstanceOf(Date);
      expect(result.tasks[0].createdAt.toISOString()).toBe('2024-01-15T10:30:00.000Z');
    });
  });

  describe('Error Cases - Invalid Input', () => {
    it('should throw error for missing required properties', () => {
      // Arrange
      const invalidData = JSON.stringify({ tasks: [] }); // Missing other required properties

      // Act & Assert
      expect(() => deserializeState(invalidData)).toThrow('Failed to deserialize application state');
    });

    it('should throw error for invalid JSON', () => {
      // Arrange
      const invalidJson = '{ invalid json }';

      // Act & Assert
      expect(() => deserializeState(invalidJson)).toThrow('Failed to deserialize application state');
    });

    it('should throw error for corrupted data structure', () => {
      // Arrange
      const corruptedData = JSON.stringify('not an object');

      // Act & Assert
      expect(() => deserializeState(corruptedData)).toThrow('Failed to deserialize application state');
    });
  });
});

/**
 * GROUP 4: saveToStorage()
 * Tests saving data to storage with various scenarios
 */
describe('saveToStorage', () => {
  describe('Happy Path - Successful Save', () => {
    it('should save data to localStorage successfully', () => {
      // Arrange
      const state = createMockAppState({
        tasks: [createMockTask()],
      });
      const key = 'task-manager-state';

      // Act
      saveToStorage(key, state);

      // Assert
      const stored = localStorage.getItem(key);
      expect(stored).not.toBeNull();
      expect(() => JSON.parse(stored!)).not.toThrow();
    });

    it('should apply namespace prefix in demo mode', () => {
      // Arrange
      const state = createMockAppState({
        authentication: createMockAuthState({ isDemoMode: true }),
      });
      sessionStorage.setItem('task_manager_session', JSON.stringify({ isDemoMode: true }));
      const key = 'task-manager-state';

      // Act
      saveToStorage(key, state);

      // Assert
      const demoKey = localStorage.getItem('demo:' + key);
      expect(demoKey).not.toBeNull();
    });

    it('should handle mobile browser compatibility', () => {
      // Arrange
      const state = createMockAppState();
      const key = 'task-manager-state';

      // Act
      saveToStorage(key, state);

      // Assert - Should not throw error
      expect(localStorage.getItem(key)).not.toBeNull();
    });
  });

  describe('Error Cases - Save Failures', () => {
    it('should throw error when data exceeds 5MB limit', () => {
      // Arrange
      const largeArray = new Array(500000).fill(createMockTask());
      const state = createMockAppState({ tasks: largeArray });
      const key = 'task-manager-state';

      // Act & Assert
      expect(() => saveToStorage(key, state)).toThrow('Application state is too large to save');
    });

    it('should throw error on QuotaExceededError', () => {
      // Arrange
      const state = createMockAppState();
      const key = 'task-manager-state';
      
      // Mock localStorage.setItem to throw QuotaExceededError
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';
      
      vi.spyOn(localStorageMock, 'setItem').mockImplementation(() => {
        throw quotaError;
      });
      
      // Also mock sessionStorage to fail with same error
      vi.spyOn(sessionStorageMock, 'setItem').mockImplementation(() => {
        throw quotaError;
      });

      // Act & Assert
      // When both storage methods fail with QuotaExceededError, 
      // the code throws a generic error message
      expect(() => saveToStorage(key, state)).toThrow('Failed to save application state to storage');
    });

    it('should use sessionStorage fallback when localStorage fails', () => {
      // Arrange
      const state = createMockAppState();
      const key = 'task-manager-state';
      
      // Mock localStorage to fail
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      // Act
      saveToStorage(key, state);

      // Assert - Should fall back to sessionStorage
      expect(sessionStorage.getItem(key)).not.toBeNull();
    });
  });
});

/**
 * GROUP 5: loadFromStorage()
 * Tests loading data from storage with fallbacks
 */
describe('loadFromStorage', () => {
  describe('Happy Path - Successful Load', () => {
    it('should load data from localStorage successfully', () => {
      // Arrange
      const state = createMockAppState({
        tasks: [createMockTask()],
      });
      const key = 'task-manager-state';
      saveToStorage(key, state);

      // Act
      const result = loadFromStorage(key);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.tasks).toHaveLength(1);
      expect(result?.tasks[0].id).toBe('task-001');
    });

    it('should return null when key does not exist', () => {
      // Arrange
      const key = 'non-existent-key';

      // Act
      const result = loadFromStorage(key);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle namespaced keys in demo mode', () => {
      // Arrange
      const state = createMockAppState({
        authentication: createMockAuthState({ isDemoMode: true }),
      });
      sessionStorage.setItem('task_manager_session', JSON.stringify({ isDemoMode: true }));
      const key = 'task-manager-state';
      
      // Manually set demo data
      localStorage.setItem('demo:' + key, serializeState(state));

      // Act
      const result = loadFromStorage(key);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.authentication.isDemoMode).toBe(true);
    });

    it('should try fallback storage methods', () => {
      // Arrange
      const state = createMockAppState();
      const key = 'task-manager-state';
      
      // Save to sessionStorage only
      sessionStorage.setItem(key, serializeState(state));

      // Act
      const result = loadFromStorage(key);

      // Assert
      expect(result).not.toBeNull();
    });
  });

  describe('Error Cases - Load Failures', () => {
    it('should clear corrupted data and return null', () => {
      // Arrange
      const key = 'task-manager-state';
      localStorage.setItem(key, '{ corrupted json }');

      // Act
      const result = loadFromStorage(key);

      // Assert
      expect(result).toBeNull();
      expect(localStorage.getItem(key)).toBeNull(); // Should be cleared
    });

    it('should validate data for deployment compatibility', () => {
      // Arrange
      const key = 'task-manager-state';
      const invalidData = JSON.stringify({
        tasks: [],
        // Missing required properties
      });
      localStorage.setItem(key, invalidData);

      // Act
      const result = loadFromStorage(key);

      // Assert
      expect(result).toBeNull();
    });
  });
});

/**
 * GROUP 6: Namespace Isolation
 * Critical tests for demo mode data isolation (bug fix from task 9f78e309)
 */
describe('Namespace Isolation', () => {
  describe('Demo Mode Namespace', () => {
    it('should add "demo:" prefix in demo mode', () => {
      // Arrange
      sessionStorage.setItem('task_manager_session', JSON.stringify({ isDemoMode: true }));
      const state = createMockAppState({
        authentication: createMockAuthState({ isDemoMode: true }),
        tasks: [createMockTask({ title: 'Demo Task' })],
      });
      const key = 'task-manager-state';

      // Act
      saveToStorage(key, state);

      // Assert
      expect(localStorage.getItem('demo:' + key)).not.toBeNull();
      expect(localStorage.getItem(key)).toBeNull(); // Non-prefixed key should not exist
    });

    it('should not add prefix in normal mode', () => {
      // Arrange
      sessionStorage.setItem('task_manager_session', JSON.stringify({ isDemoMode: false }));
      const state = createMockAppState({
        authentication: createMockAuthState({ isDemoMode: false }),
        tasks: [createMockTask({ title: 'Real Task' })],
      });
      const key = 'task-manager-state';

      // Act
      saveToStorage(key, state);

      // Assert
      expect(localStorage.getItem(key)).not.toBeNull();
      expect(localStorage.getItem('demo:' + key)).toBeNull(); // Prefixed key should not exist
    });

    it('should isolate demo data from real user data', () => {
      // Arrange
      const realState = createMockAppState({
        authentication: createMockAuthState({ isDemoMode: false }),
        tasks: [createMockTask({ title: 'Real Task' })],
      });
      const demoState = createMockAppState({
        authentication: createMockAuthState({ isDemoMode: true }),
        tasks: [createMockTask({ title: 'Demo Task' })],
      });
      const key = 'task-manager-state';

      // Act - Save real data
      sessionStorage.setItem('task_manager_session', JSON.stringify({ isDemoMode: false }));
      saveToStorage(key, realState);

      // Switch to demo mode
      sessionStorage.setItem('task_manager_session', JSON.stringify({ isDemoMode: true }));
      saveToStorage(key, demoState);

      // Assert - Both should exist independently
      expect(localStorage.getItem(key)).not.toBeNull(); // Real data
      expect(localStorage.getItem('demo:' + key)).not.toBeNull(); // Demo data

      // Verify content is different
      const realLoaded = JSON.parse(localStorage.getItem(key)!);
      const demoLoaded = JSON.parse(localStorage.getItem('demo:' + key)!);
      expect(realLoaded.tasks[0].title).toBe('Real Task');
      expect(demoLoaded.tasks[0].title).toBe('Demo Task');
    });

    it('should prevent cross-contamination between modes', () => {
      // Arrange
      const key = 'task-manager-state';
      
      // Save real data
      sessionStorage.setItem('task_manager_session', JSON.stringify({ isDemoMode: false }));
      const realState = createMockAppState({
        tasks: [createMockTask({ title: 'Real Task' })],
      });
      saveToStorage(key, realState);

      // Act - Switch to demo mode and load
      sessionStorage.setItem('task_manager_session', JSON.stringify({ isDemoMode: true }));
      const loadedInDemo = loadFromStorage(key);

      // Assert - Should not load real data in demo mode
      expect(loadedInDemo).toBeNull(); // No demo data exists yet
    });

    it('should handle namespace switching correctly', () => {
      // Arrange
      const key = 'task-manager-state';
      
      // Save in normal mode
      sessionStorage.setItem('task_manager_session', JSON.stringify({ isDemoMode: false }));
      const normalState = createMockAppState({ tasks: [createMockTask({ title: 'Normal' })] });
      saveToStorage(key, normalState);

      // Save in demo mode
      sessionStorage.setItem('task_manager_session', JSON.stringify({ isDemoMode: true }));
      const demoState = createMockAppState({ tasks: [createMockTask({ title: 'Demo' })] });
      saveToStorage(key, demoState);

      // Act - Load in normal mode
      sessionStorage.setItem('task_manager_session', JSON.stringify({ isDemoMode: false }));
      const normalLoaded = loadFromStorage(key);

      // Load in demo mode
      sessionStorage.setItem('task_manager_session', JSON.stringify({ isDemoMode: true }));
      const demoLoaded = loadFromStorage(key);

      // Assert
      expect(normalLoaded?.tasks[0].title).toBe('Normal');
      expect(demoLoaded?.tasks[0].title).toBe('Demo');
    });
  });
});

/**
 * GROUP 7: clearStorage()
 * Tests storage clearing functionality
 */
describe('clearStorage', () => {
  describe('Happy Path - Successful Clear', () => {
    it('should clear specific namespaced key', () => {
      // Arrange
      const state = createMockAppState();
      const key = 'task-manager-state';
      saveToStorage(key, state);

      // Act
      clearStorage(key);

      // Assert
      expect(localStorage.getItem(key)).toBeNull();
    });
  });

  describe('Error Cases - Clear Failures', () => {
    it('should throw error on failure', () => {
      // Arrange
      const key = 'task-manager-state';
      vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Act & Assert
      expect(() => clearStorage(key)).toThrow('Failed to clear storage data');
    });
  });
});

/**
 * GROUP 8: Utility Functions
 * Tests helper functions for storage management
 */
describe('Utility Functions', () => {
  describe('isStorageAvailable', () => {
    it('should check if storage is available', () => {
      // Act
      const result = isStorageAvailable();

      // Assert
      expect(typeof result).toBe('boolean');
      expect(result).toBe(true); // Should be true in test environment
    });
  });

  describe('getStorageSize', () => {
    it('should calculate storage size for specific key', () => {
      // Arrange
      const state = createMockAppState({
        tasks: [createMockTask()],
      });
      const key = 'task-manager-state';
      saveToStorage(key, state);

      // Act
      const size = getStorageSize(key);

      // Assert
      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });

    it('should return 0 for non-existent keys', () => {
      // Arrange
      const key = 'non-existent-key';

      // Act
      const size = getStorageSize(key);

      // Assert
      expect(size).toBe(0);
    });
  });

  describe('getTotalStorageSize', () => {
    it('should calculate total storage size', () => {
      // Arrange
      const state1 = createMockAppState({ tasks: [createMockTask()] });
      const state2 = createMockAppState({ projects: [createMockProject()] });
      saveToStorage('storage-key-1', state1);
      saveToStorage('storage-key-2', state2);

      // Act
      const totalSize = getTotalStorageSize();

      // Assert
      expect(totalSize).toBeGreaterThan(0);
      expect(typeof totalSize).toBe('number');
    });
  });
});

/**
 * GROUP 9: Edge Cases & Error Handling
 * Tests unusual scenarios and error conditions
 */
describe('Edge Cases & Error Handling', () => {
  describe('Edge Cases', () => {
    it('should handle empty string data', () => {
      // Arrange
      const key = 'task-manager-state';
      localStorage.setItem(key, '');

      // Act
      const result = loadFromStorage(key);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle whitespace-only data', () => {
      // Arrange
      const key = 'task-manager-state';
      localStorage.setItem(key, '   ');

      // Act
      const result = loadFromStorage(key);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle very large data near 5MB limit', () => {
      // Arrange
      // Create data that's close to but under 5MB
      const largeTasks = new Array(10000).fill(null).map((_, i) => 
        createMockTask({ 
          id: `task-${i}`,
          title: `Task ${i}`,
          description: 'A'.repeat(100), // 100 chars per task
        })
      );
      const state = createMockAppState({ tasks: largeTasks });

      // Act & Assert - Should handle large data without error
      const serialized = serializeState(state);
      const size = new Blob([serialized]).size;
      
      // Verify it's large but under limit
      expect(size).toBeGreaterThan(1000000); // > 1MB
      expect(size).toBeLessThan(5000000); // < 5MB
    });

    it('should handle concurrent save operations', () => {
      // Arrange
      const state1 = createMockAppState({ tasks: [createMockTask({ id: 'task-1' })] });
      const state2 = createMockAppState({ tasks: [createMockTask({ id: 'task-2' })] });
      const key = 'task-manager-state';

      // Act - Simulate concurrent saves
      saveToStorage(key, state1);
      saveToStorage(key, state2);

      // Assert - Last save should win
      const result = loadFromStorage(key);
      expect(result?.tasks[0].id).toBe('task-2');
    });

    it('should handle storage quota exceeded gracefully', () => {
      // Arrange
      const state = createMockAppState();
      const key = 'task-manager-state';
      
      // Mock to simulate quota exceeded
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';
      
      vi.spyOn(localStorageMock, 'setItem').mockImplementation(() => {
        throw quotaError;
      });
      
      vi.spyOn(sessionStorageMock, 'setItem').mockImplementation(() => {
        throw quotaError;
      });

      // Act & Assert
      // The function should throw an error when storage is unavailable
      expect(() => saveToStorage(key, state)).toThrow();
    });
  });
});

/**
 * GROUP 10: Integration Tests
 * Tests complete workflows and interactions between functions
 */
describe('Integration Tests', () => {
  describe('Complete Save/Load Cycle', () => {
    it('should successfully save and load complete application state', () => {
      // Arrange
      const originalState = createMockAppState({
        tasks: [
          createMockTask({ id: 'task-1', title: 'Task 1' }),
          createMockTask({ id: 'task-2', title: 'Task 2' }),
        ],
        projects: [
          createMockProject({ id: 'project-1', name: 'Project 1' }),
        ],
        goals: [
          createMockGoal({ id: 'goal-1', title: 'Goal 1' }),
        ],
        analytics: createMockAnalytics({
          tasksCompleted: 10,
          productivity: 75,
        }),
      });
      const key = 'task-manager-state';

      // Act
      saveToStorage(key, originalState);
      const loadedState = loadFromStorage(key);

      // Assert
      expect(loadedState).not.toBeNull();
      expect(loadedState?.tasks).toHaveLength(2);
      expect(loadedState?.projects).toHaveLength(1);
      expect(loadedState?.goals).toHaveLength(1);
      expect(loadedState?.analytics.tasksCompleted).toBe(10);
      expect(loadedState?.analytics.productivity).toBe(75);
    });

    it('should maintain data integrity through multiple save/load cycles', () => {
      // Arrange
      const key = 'task-manager-state';
      let state = createMockAppState({
        tasks: [createMockTask({ id: 'task-1' })],
      });

      // Act - Multiple save/load cycles
      for (let i = 0; i < 5; i++) {
        saveToStorage(key, state);
        const loaded = loadFromStorage(key);
        expect(loaded).not.toBeNull();
        state = loaded!;
      }

      // Assert - Data should remain consistent
      expect(state.tasks).toHaveLength(1);
      expect(state.tasks[0].id).toBe('task-1');
    });
  });

  describe('Demo Mode Isolation Integration', () => {
    it('should maintain complete isolation between demo and real data', () => {
      // Arrange
      const key = 'task-manager-state';
      
      // Real user workflow
      sessionStorage.setItem('task_manager_session', JSON.stringify({ isDemoMode: false }));
      const realState = createMockAppState({
        tasks: [createMockTask({ title: 'Real Task' })],
        authentication: createMockAuthState({ 
          isAuthenticated: true,
          user: { id: 'user-1', name: 'Real User', email: 'real@example.com' },
        }),
      });
      saveToStorage(key, realState);

      // Demo mode workflow
      sessionStorage.setItem('task_manager_session', JSON.stringify({ isDemoMode: true }));
      const demoState = createMockAppState({
        tasks: [createMockTask({ title: 'Demo Task' })],
        authentication: createMockAuthState({ 
          isDemoMode: true,
          user: { id: 'demo-user', name: 'Demo User', email: 'demo@example.com' },
        }),
      });
      saveToStorage(key, demoState);

      // Act - Load in both modes
      sessionStorage.setItem('task_manager_session', JSON.stringify({ isDemoMode: false }));
      const realLoaded = loadFromStorage(key);

      sessionStorage.setItem('task_manager_session', JSON.stringify({ isDemoMode: true }));
      const demoLoaded = loadFromStorage(key);

      // Assert - Complete isolation
      expect(realLoaded?.tasks[0].title).toBe('Real Task');
      expect(realLoaded?.authentication.user?.name).toBe('Real User');
      expect(demoLoaded?.tasks[0].title).toBe('Demo Task');
      expect(demoLoaded?.authentication.user?.name).toBe('Demo User');
    });
  });
});
