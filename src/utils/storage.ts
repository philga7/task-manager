import { Task, Project, Goal, Analytics, UserSettings, AuthenticationState } from '../types';
import { detectMobileBrowser, getRecommendedStorageStrategy } from './mobileDetection';

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
 * Saves state to localStorage with comprehensive error handling and mobile browser compatibility
 */
export function saveToStorage(key: string, state: AppState): void {
  try {
    const serializedData = serializeState(state);
    const browserInfo = detectMobileBrowser();
    const strategy = getRecommendedStorageStrategy();
    
    // Check if data would exceed recommended size for current browser
    const dataSize = new Blob([serializedData]).size;
    
    if (dataSize > strategy.maxDataSize) {
      throw new Error(`Data size (${(dataSize / 1024 / 1024).toFixed(2)}MB) exceeds recommended limit for ${browserInfo.browserName} (${(strategy.maxDataSize / 1024 / 1024).toFixed(1)}MB)`);
    }
    
    // Use recommended storage strategy
    if (strategy.primary === 'localStorage' && browserInfo.supportsLocalStorage) {
      localStorage.setItem(key, serializedData);
    } else if (strategy.primary === 'sessionStorage' && browserInfo.supportsSessionStorage) {
      sessionStorage.setItem(key, serializedData);
    } else {
      // Fallback to first available storage method
      if (browserInfo.supportsLocalStorage) {
        localStorage.setItem(key, serializedData);
      } else if (browserInfo.supportsSessionStorage) {
        sessionStorage.setItem(key, serializedData);
      } else {
        throw new Error('No compatible storage method available');
      }
    }
    
    // Log storage strategy for debugging
    console.log(`Saved to ${strategy.primary} using ${browserInfo.browserName} strategy`);
    
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('Storage quota exceeded:', error);
      throw new Error('Storage limit exceeded. Please clear some data or use a different storage method.');
    } else if (error instanceof Error && error.message.includes('Data size')) {
      console.error('Data too large for storage:', error);
      throw new Error('Application state is too large to save. Please reduce the amount of data.');
    } else {
      console.error('Error saving to storage:', error);
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
    
    // Try primary storage method first
    if (strategy.primary === 'localStorage' && browserInfo.supportsLocalStorage) {
      data = localStorage.getItem(key);
    } else if (strategy.primary === 'sessionStorage' && browserInfo.supportsSessionStorage) {
      data = sessionStorage.getItem(key);
    }
    
    // If no data in primary storage, try fallbacks
    if (!data) {
      for (const fallback of strategy.fallbacks) {
        if (fallback === 'localStorage' && browserInfo.supportsLocalStorage) {
          data = localStorage.getItem(key);
          if (data) break;
        } else if (fallback === 'sessionStorage' && browserInfo.supportsSessionStorage) {
          data = sessionStorage.getItem(key);
          if (data) break;
        }
      }
    }
    
    if (data === null) {
      return null; // No data found, not an error
    }
    
    if (data.trim() === '') {
      console.warn('Empty data found in storage, returning null');
      return null;
    }
    
    return deserializeState(data);
  } catch (error) {
    console.error('Error loading from storage:', error);
    
    // If data is corrupted, clear it and return null
    try {
      const browserInfo = detectMobileBrowser();
      if (browserInfo.supportsLocalStorage) {
        localStorage.removeItem(key);
      }
      if (browserInfo.supportsSessionStorage) {
        sessionStorage.removeItem(key);
      }
      console.warn('Corrupted data cleared from storage');
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

  // Mobile-compatible obfuscation (not encryption, just makes it harder to read)
  private static obfuscate(data: string): string {
    try {
      // Use btoa if available, otherwise use simple encoding
      if (typeof btoa !== 'undefined') {
        return btoa(data + '_' + Date.now());
      } else {
        // Fallback for browsers without btoa
        return encodeURIComponent(data + '_' + Date.now());
      }
    } catch (error) {
      console.warn('btoa not available, using fallback encoding:', error);
      return encodeURIComponent(data + '_' + Date.now());
    }
  }

  private static deobfuscate(obfuscatedData: string): string | null {
    try {
      // Try btoa first
      if (typeof atob !== 'undefined') {
        const decoded = atob(obfuscatedData);
        return decoded.split('_')[0];
      } else {
        // Fallback for browsers without atob
        const decoded = decodeURIComponent(obfuscatedData);
        return decoded.split('_')[0];
      }
    } catch (error) {
      console.warn('atob not available, trying fallback decoding:', error);
      try {
        const decoded = decodeURIComponent(obfuscatedData);
        return decoded.split('_')[0];
      } catch {
        return null;
      }
    }
  }

  // Try multiple storage mechanisms with mobile browser compatibility
  static async save(key: string, data: unknown): Promise<boolean> {
    const serializedData = JSON.stringify(data);
    const obfuscatedData = this.obfuscate(serializedData);
    const browserInfo = detectMobileBrowser();
    const strategy = getRecommendedStorageStrategy();
    
    // Check data size against recommended limits
    const dataSize = new Blob([obfuscatedData]).size;
    if (dataSize > strategy.maxDataSize) {
      console.warn(`Data size (${(dataSize / 1024 / 1024).toFixed(2)}MB) exceeds recommended limit for ${browserInfo.browserName}`);
    }
    
    // Try primary storage method first
    try {
      if (strategy.primary === 'localStorage' && browserInfo.supportsLocalStorage) {
        localStorage.setItem(key, obfuscatedData);
        console.log(`Saved to localStorage using ${browserInfo.browserName} strategy`);
        return true;
      } else if (strategy.primary === 'sessionStorage' && browserInfo.supportsSessionStorage) {
        sessionStorage.setItem(key, obfuscatedData);
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
          localStorage.setItem(key, obfuscatedData);
          console.log(`Saved to localStorage fallback`);
          return true;
        } else if (fallback === 'sessionStorage' && browserInfo.supportsSessionStorage) {
          sessionStorage.setItem(key, obfuscatedData);
          console.log(`Saved to sessionStorage fallback`);
          return true;
        } else if (fallback === 'indexedDB' && browserInfo.supportsIndexedDB) {
          await this.saveToIndexedDB(key, obfuscatedData);
          console.log(`Saved to IndexedDB fallback`);
          return true;
        } else if (fallback === 'cookies' && browserInfo.supportsCookies) {
          document.cookie = `${key}=${encodeURIComponent(obfuscatedData)}; max-age=31536000; path=/`;
          console.log(`Saved to cookies fallback`);
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
    
    // Try primary storage method first
    try {
      if (strategy.primary === 'localStorage' && browserInfo.supportsLocalStorage) {
        const data = localStorage.getItem(key);
        if (data) {
          const deobfuscated = this.deobfuscate(data);
          if (deobfuscated) {
            console.log(`Loaded from localStorage using ${browserInfo.browserName} strategy`);
            return JSON.parse(deobfuscated);
          }
        }
      } else if (strategy.primary === 'sessionStorage' && browserInfo.supportsSessionStorage) {
        const data = sessionStorage.getItem(key);
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
          const data = localStorage.getItem(key);
          if (data) {
            const deobfuscated = this.deobfuscate(data);
            if (deobfuscated) {
              console.log(`Loaded from localStorage fallback`);
              return JSON.parse(deobfuscated);
            }
          }
        } else if (fallback === 'sessionStorage' && browserInfo.supportsSessionStorage) {
          const data = sessionStorage.getItem(key);
          if (data) {
            const deobfuscated = this.deobfuscate(data);
            if (deobfuscated) {
              console.log(`Loaded from sessionStorage fallback`);
              return JSON.parse(deobfuscated);
            }
          }
        } else if (fallback === 'indexedDB' && browserInfo.supportsIndexedDB) {
          const indexedData = await this.loadFromIndexedDB(key);
          if (indexedData) {
            const deobfuscated = this.deobfuscate(indexedData);
            if (deobfuscated) {
              console.log(`Loaded from IndexedDB fallback`);
              return JSON.parse(deobfuscated);
            }
          }
        } else if (fallback === 'cookies' && browserInfo.supportsCookies) {
          const cookies = document.cookie.split(';');
          for (const cookie of cookies) {
            const [cookieKey, cookieValue] = cookie.trim().split('=');
            if (cookieKey === key) {
              const deobfuscated = this.deobfuscate(decodeURIComponent(cookieValue));
              if (deobfuscated) {
                console.log(`Loaded from cookies fallback`);
                return JSON.parse(deobfuscated);
              }
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
