import { Task, Project, Goal, Analytics, UserSettings, AuthenticationState } from '../types';

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
    console.error('Error serializing state:', error);
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
    console.error('Error deserializing state:', error);
    throw new Error('Failed to deserialize application state - data may be corrupted');
  }
}

/**
 * Saves state to localStorage with comprehensive error handling
 */
export function saveToStorage(key: string, state: AppState): void {
  try {
    const serializedData = serializeState(state);
    
    // Check if data would exceed localStorage quota (typically 5-10MB)
    const dataSize = new Blob([serializedData]).size;
    const maxSize = 5 * 1024 * 1024; // 5MB limit
    
    if (dataSize > maxSize) {
      throw new Error(`Data size (${(dataSize / 1024 / 1024).toFixed(2)}MB) exceeds localStorage limit`);
    }
    
    localStorage.setItem(key, serializedData);
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded:', error);
      throw new Error('Storage limit exceeded. Please clear some data or use a different storage method.');
    } else if (error instanceof Error && error.message.includes('Data size')) {
      console.error('Data too large for localStorage:', error);
      throw new Error('Application state is too large to save. Please reduce the amount of data.');
    } else {
      console.error('Error saving to localStorage:', error);
      throw new Error('Failed to save application state to storage');
    }
  }
}

/**
 * Loads state from localStorage with error handling and fallback
 */
export function loadFromStorage(key: string): AppState | null {
  try {
    const data = localStorage.getItem(key);
    
    if (data === null) {
      return null; // No data found, not an error
    }
    
    if (data.trim() === '') {
      console.warn('Empty data found in localStorage, returning null');
      return null;
    }
    
    return deserializeState(data);
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    
    // If data is corrupted, clear it and return null
    try {
      localStorage.removeItem(key);
      console.warn('Corrupted data cleared from localStorage');
    } catch (clearError) {
      console.error('Failed to clear corrupted data:', clearError);
    }
    
    return null;
  }
}

/**
 * Clears specific storage key
 */
export function clearStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw new Error('Failed to clear storage data');
  }
}

/**
 * Checks if localStorage is available and working
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.warn('localStorage is not available:', error);
    return false;
  }
}

/**
 * Gets the size of stored data for a specific key
 */
export function getStorageSize(key: string): number {
  try {
    const data = localStorage.getItem(key);
    if (data === null) {
      return 0;
    }
    return new Blob([data]).size;
  } catch (error) {
    console.error('Error getting storage size:', error);
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
    console.error('Error calculating total storage size:', error);
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

  // Simple obfuscation (not encryption, just makes it harder to read)
  private static obfuscate(data: string): string {
    return btoa(data + '_' + Date.now());
  }

  private static deobfuscate(obfuscatedData: string): string | null {
    try {
      const decoded = atob(obfuscatedData);
      return decoded.split('_')[0];
    } catch {
      return null;
    }
  }

  // Try multiple storage mechanisms
  static async save(key: string, data: unknown): Promise<boolean> {
    const serializedData = JSON.stringify(data);
    const obfuscatedData = this.obfuscate(serializedData);
    
    // Try localStorage first
    try {
      if (isStorageAvailable()) {
        localStorage.setItem(key, obfuscatedData);
        
        // Also save to sessionStorage as backup
        sessionStorage.setItem(key, obfuscatedData);
        
        // Save to multiple localStorage keys for redundancy
        localStorage.setItem(`${key}_backup`, obfuscatedData);
        localStorage.setItem(`${key}_${Date.now()}`, obfuscatedData);
        
        return true;
      }
    } catch (error) {
      console.warn('localStorage save failed:', error);
    }

    // Try IndexedDB as fallback
    try {
      await this.saveToIndexedDB(key, obfuscatedData);
      return true;
    } catch (error) {
      console.warn('IndexedDB save failed:', error);
    }

    // Try cookies as last resort
    try {
      document.cookie = `${key}=${encodeURIComponent(obfuscatedData)}; max-age=31536000; path=/`;
      return true;
    } catch (error) {
      console.warn('Cookie save failed:', error);
    }

    return false;
  }

  static async load(key: string): Promise<unknown | null> {
    // Try localStorage first
    try {
      if (isStorageAvailable()) {
        const data = localStorage.getItem(key);
        if (data) {
          const deobfuscated = this.deobfuscate(data);
          if (deobfuscated) {
            return JSON.parse(deobfuscated);
          }
        }

        // Try backup key
        const backupData = localStorage.getItem(`${key}_backup`);
        if (backupData) {
          const deobfuscated = this.deobfuscate(backupData);
          if (deobfuscated) {
            return JSON.parse(deobfuscated);
          }
        }

        // Try sessionStorage
        const sessionData = sessionStorage.getItem(key);
        if (sessionData) {
          const deobfuscated = this.deobfuscate(sessionData);
          if (deobfuscated) {
            return JSON.parse(deobfuscated);
          }
        }
      }
    } catch (error) {
      console.warn('localStorage load failed:', error);
    }

    // Try IndexedDB
    try {
      const indexedData = await this.loadFromIndexedDB(key);
      if (indexedData) {
        const deobfuscated = this.deobfuscate(indexedData);
        if (deobfuscated) {
          return JSON.parse(deobfuscated);
        }
      }
    } catch (error) {
      console.warn('IndexedDB load failed:', error);
    }

    // Try cookies
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [cookieKey, cookieValue] = cookie.trim().split('=');
        if (cookieKey === key) {
          const deobfuscated = this.deobfuscate(decodeURIComponent(cookieValue));
          if (deobfuscated) {
            return JSON.parse(deobfuscated);
          }
        }
      }
    } catch (error) {
      console.warn('Cookie load failed:', error);
    }

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
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}_backup`);
        sessionStorage.removeItem(key);
        
        // Clear all backup keys
        const keys = Object.keys(localStorage);
        keys.forEach(k => {
          if (k.startsWith(key + '_')) {
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
