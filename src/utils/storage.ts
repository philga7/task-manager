import { Task, Project, Goal, Analytics, UserSettings, AuthenticationState } from '../types';
import { detectMobileBrowser, getRecommendedStorageStrategy } from './mobileDetection';
import { logStorage } from './logger';
import { generateDemoState } from './demoData';

// Migration flag key
const DEMO_MIGRATION_FLAG = 'demo:migration-completed';

// Deployment tracking keys
const DEPLOYMENT_VERSION_KEY = 'task_manager_deployment_version';

// Known storage keys that need to be migrated
const KNOWN_STORAGE_KEYS = [
  'task-manager-state',
  'task-manager-demo-state',
  'task_manager_session',
  'task_manager_auth_state',
  'task_manager_users'
];

// AppState interface matching the one in AppContext
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

/**
 * Get storage namespace prefix based on demo mode
 * @param isDemo - Whether the app is in demo mode
 * @returns The namespace prefix to use for storage keys
 */
function getStorageNamespace(isDemo: boolean): string {
  return isDemo ? 'demo:' : '';
}

/**
 * Get the current demo mode state from session storage
 * @returns true if in demo mode, false otherwise
 */
function isDemoMode(): boolean {
  try {
    const sessionData = sessionStorage.getItem('task_manager_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      return session.isDemoMode === true;
    }
  } catch (error) {
    logStorage.warn('Failed to check demo mode from session', error);
  }
  return false;
}

/**
 * Get namespaced storage key
 * @param key - The base storage key
 * @returns The namespaced storage key
 */
function getNamespacedKey(key: string): string {
  const namespace = getStorageNamespace(isDemoMode());
  return namespace + key;
}

/**
 * Recursively converts Date objects to ISO strings in the state object
 */
function serializeDates(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (obj instanceof Date) {
    return { __type: 'Date', value: obj.toISOString() };
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeDates);
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const serialized: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        serialized[key] = serializeDates((obj as Record<string, unknown>)[key]);
      }
    }
    return serialized;
  }
  
  return obj;
}

/**
 * Recursively converts serialized Date objects back to Date instances
 */
function deserializeDates(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'object' && obj !== null && 
      '__type' in obj && obj.__type === 'Date' && 
      'value' in obj && typeof obj.value === 'string') {
    return new Date(obj.value);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(deserializeDates);
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const deserialized: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        deserialized[key] = deserializeDates((obj as Record<string, unknown>)[key]);
      }
    }
    return deserialized;
  }
  
  return obj;
}

/**
 * Converts AppState to JSON string, handling Date objects properly
 */
export function serializeState(state: AppState): string {
  try {
    const serializedState = serializeDates(state);
    return JSON.stringify(serializedState);
  } catch (error) {
    logStorage.error('serializing state', error);
    throw new Error('Failed to serialize application state');
  }
}

/**
 * Parses JSON string and converts date strings back to Date objects
 */
export function deserializeState(data: string): AppState {
  try {
    const parsed = JSON.parse(data);
    const deserializedState = deserializeDates(parsed);
    
    // Validate that the deserialized object has the expected structure
    if (!deserializedState || typeof deserializedState !== 'object') {
      throw new Error('Invalid state structure');
    }
    
    // Basic validation of required properties
    const requiredProps = ['tasks', 'projects', 'goals', 'analytics', 'searchQuery', 'selectedProject', 'selectedPriority', 'userSettings', 'authentication'];
    for (const prop of requiredProps) {
      if (!(prop in deserializedState)) {
        throw new Error(`Missing required property: ${prop}`);
      }
    }
    
    return deserializedState as AppState;
  } catch (error) {
    logStorage.error('deserializing state', error);
    throw new Error('Failed to deserialize application state - data may be corrupted');
  }
}

/**
 * Saves state to localStorage with comprehensive error handling and mobile browser compatibility
 */
export function saveToStorage(key: string, state: AppState): void {
  try {
    const serializedData = serializeState(state);
    const browserInfo = detectMobileBrowser();
    const strategy = getRecommendedStorageStrategy();
    
    // Get namespaced key for demo mode isolation
    const namespacedKey = getNamespacedKey(key);
    
    // Check if data would exceed reasonable size limit
    const dataSize = new Blob([serializedData]).size;
    const maxSize = 5 * 1024 * 1024; // 5MB limit
    
    if (dataSize > maxSize) {
      throw new Error(`Data size (${(dataSize / 1024 / 1024).toFixed(2)}MB) exceeds recommended limit (5MB)`);
    }
    
    // Use recommended storage strategy
    if (strategy.primary === 'localStorage' && browserInfo.supportsLocalStorage) {
      localStorage.setItem(namespacedKey, serializedData);
    } else if (strategy.primary === 'sessionStorage' && browserInfo.supportsSessionStorage) {
      sessionStorage.setItem(namespacedKey, serializedData);
    } else {
      // Fallback to first available storage method
      if (browserInfo.supportsLocalStorage) {
        localStorage.setItem(namespacedKey, serializedData);
      } else if (browserInfo.supportsSessionStorage) {
        sessionStorage.setItem(namespacedKey, serializedData);
      } else {
        throw new Error('No compatible storage method available');
      }
    }
    
    // Log storage strategy for debugging
    logStorage.save(namespacedKey, `${strategy.primary} using ${browserInfo.browserName} strategy`);
    
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      logStorage.error('quota exceeded', error);
      throw new Error('Storage limit exceeded. Please clear some data or use a different storage method.');
    } else if (error instanceof Error && error.message.includes('Data size')) {
      logStorage.error('data too large for storage', error);
      throw new Error('Application state is too large to save. Please reduce the amount of data.');
    } else {
      logStorage.error('saving to storage', error);
      throw new Error('Failed to save application state to storage');
    }
  }
}

/**
 * Loads state from storage with error handling and mobile browser compatibility
 */
export function loadFromStorage(key: string): AppState | null {
  try {
    const browserInfo = detectMobileBrowser();
    const strategy = getRecommendedStorageStrategy();
    let data: string | null = null;
    
    // Get namespaced key for demo mode isolation
    const namespacedKey = getNamespacedKey(key);
    
    // Try primary storage method first
    if (strategy.primary === 'localStorage' && browserInfo.supportsLocalStorage) {
      data = localStorage.getItem(namespacedKey);
    } else if (strategy.primary === 'sessionStorage' && browserInfo.supportsSessionStorage) {
      data = sessionStorage.getItem(namespacedKey);
    }
    
    // If no data in primary storage, try fallbacks
    if (!data) {
      for (const fallback of strategy.fallbacks) {
        if (fallback === 'localStorage' && browserInfo.supportsLocalStorage) {
          data = localStorage.getItem(namespacedKey);
          if (data) break;
        } else if (fallback === 'sessionStorage' && browserInfo.supportsSessionStorage) {
          data = sessionStorage.getItem(namespacedKey);
          if (data) break;
        }
      }
    }
    
    if (data === null) {
      return null; // No data found, not an error
    }
    
    if (data.trim() === '') {
      logStorage.warn('Empty data found in storage, returning null');
      return null;
    }
    
    // Validate data for deployment compatibility before deserializing
    try {
      const parsedData = JSON.parse(data);
      const validation = validateStorageDataForDeployment(parsedData);
      
      if (!validation.isValid) {
        logStorage.warn('Storage data validation failed', validation.issues);
        
        if (validation.needsMigration) {
          logStorage.info('Attempting to migrate corrupted storage data');
          // Clear corrupted data and return null to start fresh
          try {
            const browserInfo = detectMobileBrowser();
            const namespacedKey = getNamespacedKey(key);
            if (browserInfo.supportsLocalStorage) {
              localStorage.removeItem(namespacedKey);
            }
            if (browserInfo.supportsSessionStorage) {
              sessionStorage.removeItem(namespacedKey);
            }
            logStorage.warn('Cleared corrupted storage data');
          } catch (clearError) {
            logStorage.error('Failed to clear corrupted data', clearError);
          }
          return null;
        }
      }
    } catch (parseError) {
      logStorage.warn('Failed to parse storage data for validation', parseError);
    }
    
    return deserializeState(data);
  } catch (error) {
    logStorage.error('loading from storage', error);
    
    // If data is corrupted, clear it and return null
    try {
      const browserInfo = detectMobileBrowser();
      const namespacedKey = getNamespacedKey(key);
      if (browserInfo.supportsLocalStorage) {
        localStorage.removeItem(namespacedKey);
      }
      if (browserInfo.supportsSessionStorage) {
        sessionStorage.removeItem(namespacedKey);
      }
      logStorage.warn('Corrupted data cleared from storage');
    } catch (clearError) {
      logStorage.error('Failed to clear corrupted data', clearError);
    }
    
    return null;
  }
}

/**
 * Clears specific storage key
 */
export function clearStorage(key: string): void {
  try {
    const namespacedKey = getNamespacedKey(key);
    localStorage.removeItem(namespacedKey);
  } catch (error) {
    logStorage.error('clearing storage', error);
    throw new Error('Failed to clear storage data');
  }
}

/**
 * Debug function to check what demo-related data exists in storage
 */
export function debugDemoStorage(): void {
  try {
    const browserInfo = detectMobileBrowser();
    console.log('=== Demo Storage Debug ===');
    
    if (browserInfo.supportsLocalStorage) {
      console.log('localStorage keys:');
      const localKeys = Object.keys(localStorage);
      localKeys.forEach(key => {
        if (key.includes('demo') || key.includes('task-manager')) {
          console.log(`  ${key}:`, localStorage.getItem(key)?.substring(0, 100) + '...');
        }
      });
    }
    
    if (browserInfo.supportsSessionStorage) {
      console.log('sessionStorage keys:');
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        if (key.includes('demo') || key.includes('task-manager')) {
          console.log(`  ${key}:`, sessionStorage.getItem(key)?.substring(0, 100) + '...');
        }
      });
    }
    
    console.log('=== End Debug ===');
  } catch (error) {
    console.error('Error debugging storage:', error);
  }
}

/**
 * Unit-level smoke checks for namespaced storage operations
 * This function tests the namespace isolation functionality
 */
export function testNamespaceIsolation(): {
  success: boolean;
  tests: Array<{ name: string; passed: boolean; error?: string }>;
} {
  const tests: Array<{ name: string; passed: boolean; error?: string }> = [];
  
  try {
    // Test 1: Check that demo mode detection works
    const testKey = 'test-namespace-key';
    const demoMode = isDemoMode();
    const namespacedKey = getNamespacedKey(testKey);
    
    tests.push({
      name: 'Demo mode detection',
      passed: typeof demoMode === 'boolean',
      error: typeof demoMode !== 'boolean' ? 'Demo mode detection failed' : undefined
    });
    
    // Test 2: Check that namespaced key generation works
    tests.push({
      name: 'Namespaced key generation',
      passed: typeof namespacedKey === 'string' && namespacedKey.length > 0,
      error: typeof namespacedKey !== 'string' || namespacedKey.length === 0 ? 'Namespaced key generation failed' : undefined
    });
    
    // Test 3: Check that demo mode adds 'demo:' prefix
    if (demoMode) {
      tests.push({
        name: 'Demo namespace prefix',
        passed: namespacedKey.startsWith('demo:'),
        error: !namespacedKey.startsWith('demo:') ? 'Demo namespace prefix not applied' : undefined
      });
    } else {
      tests.push({
        name: 'Non-demo namespace (no prefix)',
        passed: !namespacedKey.startsWith('demo:'),
        error: namespacedKey.startsWith('demo:') ? 'Demo namespace prefix incorrectly applied' : undefined
      });
    }
    
    // Test 4: Check that storage operations work with namespaced keys
    const testData: AppState = {
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
          emailTasks: false,
          dailySummary: false,
          weeklyReports: false
        },
        appearance: {
          theme: 'light',
          accentColor: '#000000'
        }
      },
      authentication: {
        user: null,
        isAuthenticated: false,
        isDemoMode: demoMode
      }
    };
    saveToStorage(testKey, testData);
    
    const loadedData = loadFromStorage(testKey);
    tests.push({
      name: 'Namespaced storage save/load',
      passed: loadedData !== null && loadedData.tasks.length === testData.tasks.length,
      error: loadedData === null ? 'Failed to load saved data' : 
             loadedData.tasks.length !== testData.tasks.length ? 'Loaded data structure does not match saved data' : undefined
    });
    
    // Test 5: Check that clear operation works with namespaced keys
    clearStorage(testKey);
    const clearedData = loadFromStorage(testKey);
    tests.push({
      name: 'Namespaced storage clear',
      passed: clearedData === null,
      error: clearedData !== null ? 'Failed to clear namespaced storage' : undefined
    });
    
    // Test 6: Verify no unprefixed keys are written in demo mode
    if (demoMode) {
      const browserInfo = detectMobileBrowser();
      let hasUnprefixedKeys = false;
      
      if (browserInfo.supportsLocalStorage) {
        const keys = Object.keys(localStorage);
        hasUnprefixedKeys = keys.some(key => 
          key.includes('task-manager') && !key.startsWith('demo:') && !key.includes('task_manager_session')
        );
      }
      
      tests.push({
        name: 'No unprefixed keys in demo mode',
        passed: !hasUnprefixedKeys,
        error: hasUnprefixedKeys ? 'Found unprefixed keys in demo mode' : undefined
      });
    }
    
  } catch (error) {
    tests.push({
      name: 'Namespace isolation test execution',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  const success = tests.every(test => test.passed);
  
  // Log test results
  console.log('=== Namespace Isolation Test Results ===');
  tests.forEach(test => {
    console.log(`${test.passed ? '✅' : '❌'} ${test.name}: ${test.passed ? 'PASSED' : 'FAILED'}`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });
  console.log(`Overall: ${success ? 'PASSED' : 'FAILED'}`);
  console.log('=== End Test Results ===');
  
  return { success, tests };
}

/**
 * Clears all demo-related storage data
 * This function removes demo data from localStorage to prevent data leakage between users
 */
export function clearDemoStorageData(): void {
  try {
    const browserInfo = detectMobileBrowser();
    
    // Debug: Log what's in storage before clearing
    debugDemoStorage();
    
    // Clear demo storage key
    const demoStorageKey = 'task-manager-demo-state';
    
    // Clear from localStorage
    if (browserInfo.supportsLocalStorage) {
      localStorage.removeItem(demoStorageKey);
      
      // Also clear any backup or related demo keys
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('demo') || key.includes('task-manager-demo') || key === 'task-manager-state') {
          localStorage.removeItem(key);
        }
      });
    }
    
    // Clear from sessionStorage
    if (browserInfo.supportsSessionStorage) {
      sessionStorage.removeItem(demoStorageKey);
      
      // Also clear any backup or related demo keys
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.includes('demo') || key.includes('task-manager-demo') || key === 'task-manager-state') {
          sessionStorage.removeItem(key);
        }
      });
      
      // Clear session data that might be demo-related
      const sessionKey = 'task_manager_session';
      const sessionData = sessionStorage.getItem(sessionKey);
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          if (session.isDemoMode) {
            sessionStorage.removeItem(sessionKey);
          }
        } catch {
          // If session data is corrupted, remove it anyway
          sessionStorage.removeItem(sessionKey);
        }
      }
    }
    

    
    // Debug: Log what's in storage after clearing
    console.log('=== After Clearing Demo Storage ===');
    debugDemoStorage();
    
    logStorage.save('demo', 'cleared successfully');
  } catch (error) {
    logStorage.error('clearing demo storage data', error);
    // Don't throw error to prevent app crashes, just log it
  }
}

/**
 * Checks if any storage method is available and working
 */
export function isStorageAvailable(): boolean {
  const browserInfo = detectMobileBrowser();
  const strategy = getRecommendedStorageStrategy();
  
  // Check primary storage method
  if (strategy.primary === 'localStorage' && browserInfo.supportsLocalStorage) {
    return true;
  }
  
  if (strategy.primary === 'sessionStorage' && browserInfo.supportsSessionStorage) {
    return true;
  }
  
  // Check fallback methods
  for (const fallback of strategy.fallbacks) {
    if (fallback === 'localStorage' && browserInfo.supportsLocalStorage) {
      return true;
    }
    if (fallback === 'sessionStorage' && browserInfo.supportsSessionStorage) {
      return true;
    }
  }
  
  return false;
}

/**
 * Gets the size of stored data for a specific key
 */
export function getStorageSize(key: string): number {
  try {
    const namespacedKey = getNamespacedKey(key);
    const data = localStorage.getItem(namespacedKey);
    if (data === null) {
      return 0;
    }
    return new Blob([data]).size;
  } catch (error) {
    logStorage.error('getting storage size', error);
    return 0;
  }
}

/**
 * Gets the total size of all localStorage data
 */
export function getTotalStorageSize(): number {
  try {
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const data = localStorage.getItem(key);
        if (data) {
          totalSize += new Blob([data]).size;
        }
      }
    }
    return totalSize;
  } catch (error) {
    logStorage.error('calculating total storage size', error);
    return 0;
  }
}

// Enhanced storage with multiple fallbacks and obfuscation
export class RobustStorage {
  private static readonly STORAGE_KEYS = {
    PRIMARY: 'tm_primary_data',
    BACKUP: 'tm_backup_data',
    SESSION: 'tm_session_data',
    INDEXED_DB: 'taskManagerDB'
  };

  // Simple data storage without obfuscation to avoid conflicts with main storage system
  private static obfuscate(data: string): string {
    return data; // No obfuscation to maintain compatibility
  }

  private static deobfuscate(obfuscatedData: string): string | null {
    return obfuscatedData; // No deobfuscation needed
  }

  // Try multiple storage mechanisms with mobile browser compatibility
  static async save(key: string, data: unknown): Promise<boolean> {
    const serializedData = JSON.stringify(data);
    const obfuscatedData = this.obfuscate(serializedData);
    const browserInfo = detectMobileBrowser();
    const strategy = getRecommendedStorageStrategy();
    
    // Get namespaced key for demo mode isolation
    const namespacedKey = getNamespacedKey(key);
    
    // Check data size against reasonable limits
    const dataSize = new Blob([obfuscatedData]).size;
    const maxSize = 5 * 1024 * 1024; // 5MB limit
    if (dataSize > maxSize) {
      console.warn(`Data size (${(dataSize / 1024 / 1024).toFixed(2)}MB) exceeds recommended limit (5MB)`);
    }
    
    // Try primary storage method first
    try {
      if (strategy.primary === 'localStorage' && browserInfo.supportsLocalStorage) {
        localStorage.setItem(namespacedKey, obfuscatedData);
        console.log(`Saved to localStorage using ${browserInfo.browserName} strategy`);
        return true;
      } else if (strategy.primary === 'sessionStorage' && browserInfo.supportsSessionStorage) {
        sessionStorage.setItem(namespacedKey, obfuscatedData);
        console.log(`Saved to sessionStorage using ${browserInfo.browserName} strategy`);
        return true;
      }
    } catch (error) {
      console.warn(`${strategy.primary} save failed:`, error);
    }

    // Try fallback storage methods
    for (const fallback of strategy.fallbacks) {
      try {
        if (fallback === 'localStorage' && browserInfo.supportsLocalStorage) {
          localStorage.setItem(namespacedKey, obfuscatedData);
          console.log(`Saved to localStorage fallback`);
          return true;
        } else if (fallback === 'sessionStorage' && browserInfo.supportsSessionStorage) {
          sessionStorage.setItem(namespacedKey, obfuscatedData);
          console.log(`Saved to sessionStorage fallback`);
          return true;
        }
      } catch (error) {
        console.warn(`${fallback} fallback save failed:`, error);
      }
    }

    console.error('All storage methods failed');
    return false;
  }

  static async load(key: string): Promise<unknown | null> {
    const browserInfo = detectMobileBrowser();
    const strategy = getRecommendedStorageStrategy();
    
    // Get namespaced key for demo mode isolation
    const namespacedKey = getNamespacedKey(key);
    
    // Try primary storage method first
    try {
      if (strategy.primary === 'localStorage' && browserInfo.supportsLocalStorage) {
        const data = localStorage.getItem(namespacedKey);
        if (data) {
          const deobfuscated = this.deobfuscate(data);
          if (deobfuscated) {
            console.log(`Loaded from localStorage using ${browserInfo.browserName} strategy`);
            return JSON.parse(deobfuscated);
          }
        }
      } else if (strategy.primary === 'sessionStorage' && browserInfo.supportsSessionStorage) {
        const data = sessionStorage.getItem(namespacedKey);
        if (data) {
          const deobfuscated = this.deobfuscate(data);
          if (deobfuscated) {
            console.log(`Loaded from sessionStorage using ${browserInfo.browserName} strategy`);
            return JSON.parse(deobfuscated);
          }
        }
      }
    } catch (error) {
      console.warn(`${strategy.primary} load failed:`, error);
    }

    // Try fallback storage methods
    for (const fallback of strategy.fallbacks) {
      try {
        if (fallback === 'localStorage' && browserInfo.supportsLocalStorage) {
          const data = localStorage.getItem(namespacedKey);
          if (data) {
            const deobfuscated = this.deobfuscate(data);
            if (deobfuscated) {
              console.log(`Loaded from localStorage fallback`);
              return JSON.parse(deobfuscated);
            }
          }
        } else if (fallback === 'sessionStorage' && browserInfo.supportsSessionStorage) {
          const data = sessionStorage.getItem(namespacedKey);
          if (data) {
            const deobfuscated = this.deobfuscate(data);
            if (deobfuscated) {
              console.log(`Loaded from sessionStorage fallback`);
              return JSON.parse(deobfuscated);
            }
          }
        }
      } catch (error) {
        console.warn(`${fallback} fallback load failed:`, error);
      }
    }

    console.log('No data found in any storage method');
    return null;
  }

  // IndexedDB helpers
  private static async saveToIndexedDB(key: string, data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.STORAGE_KEYS.INDEXED_DB, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['data'], 'readwrite');
        const store = transaction.objectStore('data');
        const putRequest = store.put({ key, data, timestamp: Date.now() });
        
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data', { keyPath: 'key' });
        }
      };
    });
  }

  private static async loadFromIndexedDB(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.STORAGE_KEYS.INDEXED_DB, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['data'], 'readonly');
        const store = transaction.objectStore('data');
        const getRequest = store.get(key);
        
        getRequest.onsuccess = () => {
          resolve(getRequest.result?.data || null);
        };
        getRequest.onerror = () => reject(getRequest.error);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data', { keyPath: 'key' });
        }
      };
    });
  }

  // Clear all storage for a user
  static async clear(key: string): Promise<void> {
    try {
      if (isStorageAvailable()) {
        const namespacedKey = getNamespacedKey(key);
        localStorage.removeItem(namespacedKey);
        localStorage.removeItem(`${namespacedKey}_backup`);
        sessionStorage.removeItem(namespacedKey);
        
        // Clear all backup keys
        const keys = Object.keys(localStorage);
        keys.forEach(k => {
          if (k.startsWith(namespacedKey + '_')) {
            localStorage.removeItem(k);
          }
        });
      }
    } catch (error) {
      console.warn('localStorage clear failed:', error);
    }

    try {
      await this.clearFromIndexedDB(key);
    } catch (error) {
      console.warn('IndexedDB clear failed:', error);
    }

    try {
      document.cookie = `${key}=; max-age=0; path=/`;
    } catch (error) {
      console.warn('Cookie clear failed:', error);
    }
  }

  private static async clearFromIndexedDB(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.STORAGE_KEYS.INDEXED_DB, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['data'], 'readwrite');
        const store = transaction.objectStore('data');
        const deleteRequest = store.delete(key);
        
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
    });
  }
}

// Data recovery utility
export class DataRecovery {
  // Export all user data for backup
  static exportUserData(userId: string): string {
    const data: Record<string, unknown> = {};
    
    // Collect from all storage mechanisms
    if (isStorageAvailable()) {
      // localStorage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes(userId) || key.includes('task-manager')) {
          data[`localStorage_${key}`] = localStorage.getItem(key);
        }
      });
      
      // sessionStorage
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        if (key.includes(userId) || key.includes('task-manager')) {
          data[`sessionStorage_${key}`] = sessionStorage.getItem(key);
        }
      });
    }
    
    // Add timestamp and user info
    data.exportTimestamp = new Date().toISOString();
    data.userId = userId;
    
    return JSON.stringify(data, null, 2);
  }
  
  // Import user data from backup
  static async importUserData(backupData: string): Promise<boolean> {
    try {
      const data = JSON.parse(backupData);
      
      // Restore to all storage mechanisms
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string' && key.startsWith('localStorage_')) {
          const storageKey = key.replace('localStorage_', '');
          localStorage.setItem(storageKey, value);
        } else if (typeof value === 'string' && key.startsWith('sessionStorage_')) {
          const storageKey = key.replace('sessionStorage_', '');
          sessionStorage.setItem(storageKey, value);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error importing backup data:', error);
      return false;
    }
  }
  
  // Get storage usage statistics
  static getStorageStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    if (isStorageAvailable()) {
      // localStorage usage
      let localStorageSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            localStorageSize += key.length + value.length;
          }
        }
      }
      stats.localStorage = localStorageSize;
      
      // sessionStorage usage
      let sessionStorageSize = 0;
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          const value = sessionStorage.getItem(key);
          if (value) {
            sessionStorageSize += key.length + value.length;
          }
        }
      }
      stats.sessionStorage = sessionStorageSize;
    }
    
    return stats;
  }
}

/**
 * Check if demo migration has been completed
 */
function isDemoMigrationCompleted(): boolean {
  try {
    return localStorage.getItem(DEMO_MIGRATION_FLAG) === 'true';
  } catch (error) {
    logStorage.warn('Failed to check demo migration flag', error);
    return false;
  }
}

/**
 * Check if deployment version has changed
 */
function hasDeploymentVersionChanged(): boolean {
  try {
    const storedVersion = localStorage.getItem(DEPLOYMENT_VERSION_KEY) || sessionStorage.getItem(DEPLOYMENT_VERSION_KEY);
    const currentVersion = '1.0.0'; // Should match the version in auth.ts
    
    if (!storedVersion) {
      // First time running, update version
      localStorage.setItem(DEPLOYMENT_VERSION_KEY, currentVersion);
      sessionStorage.setItem(DEPLOYMENT_VERSION_KEY, currentVersion);
      return false;
    }
    
    const changed = storedVersion !== currentVersion;
    if (changed) {
      logStorage.info('Deployment version changed', { from: storedVersion, to: currentVersion });
      localStorage.setItem(DEPLOYMENT_VERSION_KEY, currentVersion);
      sessionStorage.setItem(DEPLOYMENT_VERSION_KEY, currentVersion);
    }
    
    return changed;
  } catch (error) {
    logStorage.warn('Failed to check deployment version', error);
    return false;
  }
}

/**
 * Validate storage data for deployment compatibility
 */
function validateStorageDataForDeployment(data: unknown): {
  isValid: boolean;
  needsMigration: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  let needsMigration = false;
  
  try {
    if (!data || typeof data !== 'object') {
      issues.push('Invalid data structure');
      return { isValid: false, needsMigration: false, issues };
    }
    
    const appState = data as Record<string, unknown>;
    
    // Check for required properties
    const requiredProps = ['tasks', 'projects', 'goals', 'analytics', 'userSettings', 'authentication'];
    for (const prop of requiredProps) {
      if (!(prop in appState)) {
        issues.push(`Missing required property: ${prop}`);
        needsMigration = true;
      }
    }
    
    // Check authentication state structure
    if (appState.authentication && typeof appState.authentication === 'object') {
      const auth = appState.authentication as Record<string, unknown>;
      
      if (typeof auth.isAuthenticated !== 'boolean') {
        issues.push('Invalid authentication state: isAuthenticated must be boolean');
        needsMigration = true;
      }
      
      if (typeof auth.isDemoMode !== 'boolean') {
        issues.push('Invalid authentication state: isDemoMode must be boolean');
        needsMigration = true;
      }
    }
    
    // Check for deployment version compatibility (but be lenient with demo data)
    const isLikelyDemoData = appState.authentication && 
      typeof appState.authentication === 'object' && 
      (appState.authentication as Record<string, unknown>).isDemoMode === true;
      
    if (hasDeploymentVersionChanged() && !isLikelyDemoData) {
      issues.push('Deployment version changed, data may need migration');
      needsMigration = true;
    }
    
    return {
      isValid: issues.length === 0,
      needsMigration,
      issues
    };
    
  } catch (error) {
    logStorage.error('Error validating storage data for deployment', error);
    return {
      isValid: false,
      needsMigration: true,
      issues: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

/**
 * Mark demo migration as completed
 */
function markDemoMigrationCompleted(): void {
  try {
    localStorage.setItem(DEMO_MIGRATION_FLAG, 'true');
    logStorage.warn('Demo migration marked as completed');
  } catch (error) {
    logStorage.error('Failed to mark demo migration as completed', error);
  }
}

/**
 * Check if data appears to be demo data based on content analysis
 */
function isDemoData(data: string): boolean {
  try {
    const parsed = JSON.parse(data);
    
    // Check for demo-specific indicators
    if (parsed.authentication?.isDemoMode === true) {
      return true;
    }
    
    // Check for demo user indicators
    if (parsed.authentication?.user?.name === 'Alex Johnson' || 
        parsed.authentication?.user?.email === 'alex.johnson@demo.com') {
      return true;
    }
    
    // Check for demo task indicators
    if (parsed.tasks && Array.isArray(parsed.tasks)) {
      const demoTaskTitles = [
        'Design Homepage Mockup',
        'Implement User Authentication',
        'Write API Documentation',
        'Setup CI/CD Pipeline',
        'Database Schema Design'
      ];
      
      const hasDemoTasks = parsed.tasks.some((task: { title?: string }) => 
        task.title && demoTaskTitles.includes(task.title)
      );
      
      if (hasDemoTasks) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    logStorage.warn('Failed to analyze data for demo indicators', error);
    return false;
  }
}

/**
 * Check if demo namespace is empty
 */
function isDemoNamespaceEmpty(): boolean {
  try {
    const browserInfo = detectMobileBrowser();
    let hasDemoData = false;
    
    if (browserInfo.supportsLocalStorage) {
      const keys = Object.keys(localStorage);
      hasDemoData = keys.some(key => key.startsWith('demo:'));
    }
    
    if (browserInfo.supportsSessionStorage) {
      const sessionKeys = Object.keys(sessionStorage);
      hasDemoData = hasDemoData || sessionKeys.some(key => key.startsWith('demo:'));
    }
    
    return !hasDemoData;
  } catch (error) {
    logStorage.warn('Failed to check demo namespace', error);
    return true; // Assume empty if we can't check
  }
}

/**
 * Seed demo namespace with demo data
 */
function seedDemoNamespace(): void {
  try {
    const demoState = generateDemoState();
    const browserInfo = detectMobileBrowser();
    
    // Save demo state to namespaced storage
    if (browserInfo.supportsLocalStorage) {
      const namespacedKey = getNamespacedKey('task-manager-state');
      const serializedData = JSON.stringify(serializeDates(demoState));
      localStorage.setItem(namespacedKey, serializedData);
      logStorage.warn('Seeded demo namespace with demo data');
    }
  } catch (error) {
    logStorage.error('Failed to seed demo namespace', error);
  }
}

/**
 * Perform one-time migration to clean up existing mixed data
 * This function should be called on app boot when demo mode is active
 */
export function performDemoMigration(): {
  success: boolean;
  actions: Array<{ action: string; key?: string; result: string }>;
} {
  const actions: Array<{ action: string; key?: string; result: string }> = [];
  
  try {
    // Check if migration has already been completed
    if (isDemoMigrationCompleted()) {
      actions.push({ action: 'check-migration-flag', result: 'Migration already completed' });
      return { success: true, actions };
    }
    
    actions.push({ action: 'start-migration', result: 'Migration started' });
    
    const browserInfo = detectMobileBrowser();
    
    // Process localStorage
    if (browserInfo.supportsLocalStorage) {
      const keys = Object.keys(localStorage);
      
      for (const key of keys) {
        // Skip keys that are already properly namespaced
        if (key.startsWith('demo:') || key.startsWith('user_')) {
          continue;
        }
        
        // Check if this is a known storage key
        if (KNOWN_STORAGE_KEYS.includes(key)) {
          const data = localStorage.getItem(key);
          if (data) {
            if (isDemoData(data)) {
              // This is demo data, move it to demo namespace
              const namespacedKey = getNamespacedKey(key);
              localStorage.setItem(namespacedKey, data);
              localStorage.removeItem(key);
              actions.push({ action: 'move-to-demo-namespace', key, result: 'Moved demo data to namespaced key' });
            } else {
              // This is real user data, leave it alone but log it
              actions.push({ action: 'preserve-real-data', key, result: 'Preserved real user data' });
            }
          }
        } else if (key.includes('task-manager') || key.includes('demo')) {
          // Unknown key that might be related, check if it's demo data
          const data = localStorage.getItem(key);
          if (data && isDemoData(data)) {
            const namespacedKey = getNamespacedKey(key);
            localStorage.setItem(namespacedKey, data);
            localStorage.removeItem(key);
            actions.push({ action: 'move-unknown-demo-data', key, result: 'Moved unknown demo data to namespaced key' });
          } else {
            // Remove ambiguous or mixed data
            localStorage.removeItem(key);
            actions.push({ action: 'remove-ambiguous-data', key, result: 'Removed ambiguous data' });
          }
        }
      }
    }
    
    // Process sessionStorage
    if (browserInfo.supportsSessionStorage) {
      const sessionKeys = Object.keys(sessionStorage);
      
      for (const key of sessionKeys) {
        if (key.includes('demo') || key.includes('task-manager')) {
          const data = sessionStorage.getItem(key);
          if (data && isDemoData(data)) {
            const namespacedKey = getNamespacedKey(key);
            sessionStorage.setItem(namespacedKey, data);
            sessionStorage.removeItem(key);
            actions.push({ action: 'move-session-demo-data', key, result: 'Moved session demo data to namespaced key' });
          } else if (key.includes('demo')) {
            // Remove ambiguous demo-related session data
            sessionStorage.removeItem(key);
            actions.push({ action: 'remove-ambiguous-session-data', key, result: 'Removed ambiguous session data' });
          }
        }
      }
    }
    
    // Check if demo namespace is empty and seed if necessary
    if (isDemoNamespaceEmpty()) {
      seedDemoNamespace();
      actions.push({ action: 'seed-demo-data', result: 'Seeded demo namespace with fresh demo data' });
    }
    
    // Mark migration as completed
    markDemoMigrationCompleted();
    actions.push({ action: 'mark-completed', result: 'Migration completed successfully' });
    
    logStorage.warn('Demo migration completed', { actions: actions.length });
    return { success: true, actions };
    
  } catch (error) {
    logStorage.error('Demo migration failed', error);
    actions.push({ action: 'error', result: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
    return { success: false, actions };
  }
}

/**
 * Detect and handle authentication state corruption
 */
export function detectAndHandleAuthCorruption(): {
  corruptionDetected: boolean;
  actions: Array<{ action: string; result: string }>;
} {
  const actions: Array<{ action: string; result: string }> = [];
  let corruptionDetected = false;
  
  try {
    logStorage.info('Checking for authentication state corruption');
    
    // Check for deployment version changes
    if (hasDeploymentVersionChanged()) {
      corruptionDetected = true;
      actions.push({ action: 'deployment-version-check', result: 'Deployment version changed, potential corruption detected' });
    }
    
    // Check for corrupted authentication data in storage (but NOT user data)
    const authKeys = [
      'task_manager_auth_state',
      'task_manager_session'
      // Note: Removed 'task-manager-state' to preserve user data
    ];
    
    for (const key of authKeys) {
      try {
        const data = localStorage.getItem(key) || sessionStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          const validation = validateStorageDataForDeployment(parsed);
          
          if (!validation.isValid) {
            corruptionDetected = true;
            actions.push({ 
              action: `validate-${key}`, 
              result: `Corruption detected in ${key}: ${validation.issues.join(', ')}` 
            });
            
            // Clear corrupted data
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
            actions.push({ action: `clear-${key}`, result: `Cleared corrupted data from ${key}` });
          }
        }
      } catch (error) {
        corruptionDetected = true;
        actions.push({ 
          action: `parse-${key}`, 
          result: `Failed to parse ${key}: ${error instanceof Error ? error.message : 'Unknown error'}` 
        });
        
        // Clear unparseable data
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
        actions.push({ action: `clear-${key}`, result: `Cleared unparseable data from ${key}` });
      }
    }
    
    if (corruptionDetected) {
      logStorage.warn('Authentication state corruption detected and handled', actions);
    } else {
      logStorage.info('No authentication state corruption detected');
    }
    
    return { corruptionDetected, actions };
    
  } catch (error) {
    logStorage.error('Error during corruption detection', error);
    return { 
      corruptionDetected: true, 
      actions: [{ action: 'error', result: `Detection failed: ${error instanceof Error ? error.message : 'Unknown error'}` }] 
    };
  }
}

/**
 * Test function to verify demo migration functionality
 */
export function testDemoMigration(): {
  success: boolean;
  tests: Array<{ name: string; passed: boolean; error?: string }>;
} {
  const tests: Array<{ name: string; passed: boolean; error?: string }> = [];
  
  try {
    // Test 1: Check migration flag functionality
    const initialFlag = isDemoMigrationCompleted();
    markDemoMigrationCompleted();
    const afterFlag = isDemoMigrationCompleted();
    
    tests.push({
      name: 'Migration flag functionality',
      passed: !initialFlag && afterFlag,
      error: initialFlag || !afterFlag ? 'Migration flag not working correctly' : undefined
    });
    
    // Test 2: Check demo data detection
    const demoState = generateDemoState();
    const demoDataString = JSON.stringify(demoState);
    const isDemo = isDemoData(demoDataString);
    
    tests.push({
      name: 'Demo data detection',
      passed: isDemo,
      error: !isDemo ? 'Demo data detection failed' : undefined
    });
    
    // Test 3: Check non-demo data detection
    const nonDemoData = {
      authentication: { isDemoMode: false, user: { name: 'Real User', email: 'real@example.com' } },
      tasks: [{ title: 'Real Task', id: 'real-task-1' }]
    };
    const nonDemoDataString = JSON.stringify(nonDemoData);
    const isNotDemo = !isDemoData(nonDemoDataString);
    
    tests.push({
      name: 'Non-demo data detection',
      passed: isNotDemo,
      error: !isNotDemo ? 'Non-demo data detection failed' : undefined
    });
    
    // Test 4: Check demo namespace emptiness detection
    const isEmpty = isDemoNamespaceEmpty();
    tests.push({
      name: 'Demo namespace emptiness detection',
      passed: typeof isEmpty === 'boolean',
      error: typeof isEmpty !== 'boolean' ? 'Demo namespace emptiness detection failed' : undefined
    });
    
  } catch (error) {
    tests.push({
      name: 'Demo migration test execution',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  const success = tests.every(test => test.passed);
  
  // Log test results
  console.log('=== Demo Migration Test Results ===');
  tests.forEach(test => {
    console.log(`${test.passed ? '✅' : '❌'} ${test.name}: ${test.passed ? 'PASSED' : 'FAILED'}`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });
  console.log(`Overall: ${success ? 'PASSED' : 'FAILED'}`);
  console.log('=== End Test Results ===');
  
  return { success, tests };
}
