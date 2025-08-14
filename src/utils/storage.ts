import { Task, Project, Goal, Analytics } from '../types';

// AppState interface matching the one in AppContext
interface AppState {
  tasks: Task[];
  projects: Project[];
  goals: Goal[];
  analytics: Analytics;
  searchQuery: string;
  selectedProject: string | null;
  selectedPriority: string | null;
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
    const requiredProps = ['tasks', 'projects', 'goals', 'analytics', 'searchQuery', 'selectedProject', 'selectedPriority'];
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
