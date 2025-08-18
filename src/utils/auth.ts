import { User } from '../types';
import { detectMobileBrowser, hasCompatibilityIssues } from './mobileDetection';
import { logger, logAuth } from './logger';

// User storage interface for localStorage
interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  passwordVersion: number; // Track password hash version for migration
  salt?: string; // Salt for secure password hashing (optional for legacy users)
  createdAt: string; // ISO string for localStorage compatibility
}

// Session storage interface
interface SessionData {
  userId: string;
  email: string;
  name: string;
  loginTime: string; // ISO string
  lastActivity: string; // ISO string
  isDemoMode: boolean;
}

// Storage keys
const USERS_STORAGE_KEY = 'task_manager_users';
const SESSION_STORAGE_KEY = 'task_manager_session';
const SESSION_TIMEOUT_HOURS = 24; // Session expires after 24 hours of inactivity

// Password hash versions
const PASSWORD_VERSIONS = {
  LEGACY: 1, // Old btoa() implementation
  SECURE: 2  // New Web Crypto API implementation
};

// Check Web Crypto API availability
const isWebCryptoAvailable = typeof crypto !== 'undefined' && 
                            crypto.subtle && 
                            typeof crypto.subtle.digest === 'function' &&
                            typeof crypto.getRandomValues === 'function';

if (!isWebCryptoAvailable) {
  logger.warn('Web Crypto API not available, will use fallback methods');
}

/**
 * Generate a cryptographically secure random salt
 */
async function generateSalt(): Promise<string> {
  try {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    logAuth.error('Failed to generate salt using crypto.getRandomValues', error);
    // Fallback to Math.random for older browsers
    const fallbackSalt = Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
    logAuth.warn('Using fallback salt generation method');
    return fallbackSalt;
  }
}

/**
 * Secure password hashing using Web Crypto API (SHA-256)
 */
async function hashPasswordSecure(password: string, salt: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    logAuth.error('Failed to hash password using Web Crypto API', error);
    // Fallback to simple hash for older browsers
    const fallbackHash = btoa(password + salt);
    logAuth.warn('Using fallback password hashing method');
    return fallbackHash;
  }
}



/**
 * Legacy password verification function (for migration purposes)
 */
function verifyPasswordLegacy(password: string, hash: string): boolean {
  const salt = 'task_manager_salt_2024';
  const saltedPassword = password + salt;
  
  try {
    // Try atob first (standard browsers)
    if (typeof atob !== 'undefined') {
      const expectedHash = btoa(saltedPassword);
      return hash === expectedHash;
    } else {
      // Fallback for browsers without atob
      const expectedHash = encodeURIComponent(saltedPassword);
      return hash === expectedHash;
    }
  } catch (error) {
    logger.warn('atob not available, using fallback verification:', error);
    const expectedHash = encodeURIComponent(saltedPassword);
    return hash === expectedHash;
  }
}

/**
 * Secure password verification using Web Crypto API
 */
async function verifyPasswordSecure(password: string, hash: string, salt: string): Promise<boolean> {
  try {
    const expectedHash = await hashPasswordSecure(password, salt);
    const isValid = hash === expectedHash;
    logAuth.info(`Secure password verification: ${isValid ? 'SUCCESS' : 'FAILED'} (hash length: ${hash.length}, expected length: ${expectedHash.length})`);
    return isValid;
  } catch (error) {
    logAuth.error('Secure password verification failed', error);
    throw error;
  }
}

/**
 * Main password hashing function - uses secure method with fallback
 */
export async function hashPassword(password: string): Promise<{ hash: string; salt: string; version: number }> {
  if (isWebCryptoAvailable) {
    const salt = await generateSalt();
    const hash = await hashPasswordSecure(password, salt);
    return { hash, salt, version: PASSWORD_VERSIONS.SECURE };
  } else {
    // Fallback to legacy method for browsers without Web Crypto API
    const salt = 'task_manager_salt_2024';
    const hash = btoa(password + salt);
    return { hash, salt, version: PASSWORD_VERSIONS.LEGACY };
  }
}

/**
 * Main password verification function - handles both legacy and secure methods
 */
export async function verifyPassword(password: string, hash: string, salt: string, version: number): Promise<boolean> {
  if (version === PASSWORD_VERSIONS.LEGACY) {
    // Legacy verification (for migration)
    return verifyPasswordLegacy(password, hash);
  } else if (version === PASSWORD_VERSIONS.SECURE) {
    // Secure verification
    return await verifyPasswordSecure(password, hash, salt);
  } else {
    throw new Error('Unknown password hash version');
  }
}



/**
 * Get all registered users from storage
 */
function getRegisteredUsers(): StoredUser[] {
  try {
    let usersData: string | null = null;
    let storageMethod = 'none';
    
    // Try localStorage first
    try {
      usersData = localStorage.getItem(USERS_STORAGE_KEY);
      storageMethod = 'localStorage';
    } catch {
      logAuth.warn('localStorage failed, trying sessionStorage');
    }
    
    // Fallback to sessionStorage if localStorage fails
    if (!usersData) {
      try {
        usersData = sessionStorage.getItem(USERS_STORAGE_KEY);
        storageMethod = 'sessionStorage';
      } catch {
        logAuth.warn('sessionStorage also failed');
      }
    }
    
    logAuth.info(`Retrieved users data from ${storageMethod}: ${usersData ? 'found' : 'not found'}`);
    
    if (!usersData) {
      return [];
    }
    
    const users = JSON.parse(usersData);
    if (!Array.isArray(users)) {
      logger.warn('Invalid users data format, returning empty array');
      return [];
    }
    
    logAuth.info(`Parsed ${users.length} users from storage`);
    
    // Migrate legacy users to new format
    return users.map((user: Partial<StoredUser> & { passwordVersion?: number }) => {
      // If user doesn't have passwordVersion, it's a legacy user
      if (!user.passwordVersion) {
        return {
          ...user,
          passwordVersion: PASSWORD_VERSIONS.LEGACY,
          salt: undefined
        } as StoredUser;
      }
      return user as StoredUser;
    });
  } catch (error) {
    logAuth.error('loading registered users', error);
    return [];
  }
}

/**
 * Save users to storage
 */
function saveUsers(users: StoredUser[]): void {
  try {
    const usersData = JSON.stringify(users);
    
    // Try localStorage first
    try {
      localStorage.setItem(USERS_STORAGE_KEY, usersData);
      return;
    } catch {
      logAuth.warn('localStorage failed, trying sessionStorage');
    }
    
    // Fallback to sessionStorage
    try {
      sessionStorage.setItem(USERS_STORAGE_KEY, usersData);
      return;
    } catch {
      logAuth.warn('sessionStorage also failed');
    }
    
    throw new Error('No compatible storage method available');
  } catch (error) {
    logAuth.error('saving users to storage', error);
    throw new Error('Failed to save user data to storage');
  }
}

/**
 * Save session data to storage
 */
function saveSession(sessionData: SessionData): void {
  try {
    const sessionDataString = JSON.stringify(sessionData);
    
    // Try localStorage first
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, sessionDataString);
      return;
    } catch {
      logAuth.warn('localStorage failed, trying sessionStorage');
    }
    
    // Fallback to sessionStorage
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionDataString);
      return;
    } catch {
      logAuth.warn('sessionStorage also failed');
    }
    
    throw new Error('No compatible storage method available');
  } catch (error) {
    logAuth.error('saving session to storage', error);
    throw new Error('Failed to save session data to storage');
  }
}

/**
 * Get session data from storage
 */
function getSession(): SessionData | null {
  try {
    let sessionData: string | null = null;
    
    // Try localStorage first
    try {
      sessionData = localStorage.getItem(SESSION_STORAGE_KEY);
    } catch {
      logAuth.warn('localStorage failed, trying sessionStorage');
    }
    
    // Fallback to sessionStorage
    if (!sessionData) {
      try {
        sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);
      } catch {
        logAuth.warn('sessionStorage also failed');
      }
    }
    
    if (!sessionData) {
      return null;
    }
    
    const session = JSON.parse(sessionData);
    return session;
  } catch (error) {
    logAuth.error('loading session from storage', error);
    return null;
  }
}

/**
 * Clear session data from storage
 */
function clearSession(): void {
  try {
    // Clear from localStorage
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      logAuth.warn('Failed to clear localStorage session');
    }
    
    // Clear from sessionStorage
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      logAuth.warn('Failed to clear sessionStorage session');
    }
  } catch (error) {
    logAuth.error('clearing session from storage', error);
  }
}

/**
 * Check if session is valid and not expired
 */
function isSessionValid(session: SessionData): boolean {
  const now = new Date();
  const lastActivity = new Date(session.lastActivity);
  const hoursSinceLastActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceLastActivity < SESSION_TIMEOUT_HOURS;
}

/**
 * Update session last activity time
 */
export function updateSessionActivity(): void {
  const session = getSession();
  if (session) {
    session.lastActivity = new Date().toISOString();
    saveSession(session);
  }
}

/**
 * Create a new session for a user
 */
export function createSession(user: User, isDemoMode: boolean = false): void {
  const sessionData: SessionData = {
    userId: user.id,
    email: user.email,
    name: user.name,
    loginTime: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    isDemoMode
  };
  
  saveSession(sessionData);
}

/**
 * Get current session user if valid
 */
export function getCurrentSessionUser(): User | null {
  const session = getSession();
  
  if (!session) {
    return null;
  }
  
  if (!isSessionValid(session)) {
    logAuth.session('expired, clearing session data');
    clearSession();
    return null;
  }
  
  // For demo mode, return demo user
  if (session.isDemoMode) {
    return {
      id: session.userId,
      email: session.email,
      name: session.name,
      createdAt: new Date(session.loginTime)
    };
  }
  
  // For regular users, validate that user still exists in storage
  if (!validateUserSession(session.userId)) {
    logAuth.session('user no longer exists in storage, clearing session', session.userId);
    clearSession();
    return null;
  }
  
  // Update last activity
  updateSessionActivity();
  
  return {
    id: session.userId,
    email: session.email,
    name: session.name,
    createdAt: new Date(session.loginTime)
  };
}

/**
 * Clear current session (logout)
 */
export function clearCurrentSession(): void {
  clearSession();
}

/**
 * Check if user is currently logged in
 */
export function isUserLoggedIn(): boolean {
  const session = getSession();
  if (!session) {
    return false;
  }
  
  return isSessionValid(session);
}

/**
 * Get session info for debugging
 */
export function getSessionInfo(): { isLoggedIn: boolean; isDemoMode: boolean; lastActivity: string | null } {
  const session = getSession();
  
  if (!session) {
    return { isLoggedIn: false, isDemoMode: false, lastActivity: null };
  }
  
  return {
    isLoggedIn: isSessionValid(session),
    isDemoMode: session.isDemoMode,
    lastActivity: session.lastActivity
  };
}

/**
 * Check if a user with the given email already exists
 */
export function userExists(email: string): boolean {
  const users = getRegisteredUsers();
  return users.some(user => user.email.toLowerCase() === email.toLowerCase());
}

/**
 * Get user by email
 */
export function getUserByEmail(email: string): User | null {
  const users = getRegisteredUsers();
  const storedUser = users.find(user => user.email.toLowerCase() === email.toLowerCase());
  
  if (!storedUser) {
    return null;
  }
  
  return {
    id: storedUser.id,
    email: storedUser.email,
    name: storedUser.name,
    createdAt: new Date(storedUser.createdAt)
  };
}

/**
 * Register a new user
 */
export async function registerUser(email: string, password: string, name: string): Promise<User> {
  // Validate input
  if (!email || !password || !name) {
    throw new Error('Email, password, and name are required');
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  
  // Validate password strength (minimum 6 characters for demo)
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
  
  // Check if user already exists
  if (userExists(email)) {
    throw new Error('User with this email already exists');
  }
  
      // Create new user
    const { hash, salt, version } = await hashPassword(password);
    const newUser: StoredUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: email.toLowerCase(),
      name: name.trim(),
      passwordHash: hash,
      passwordVersion: version,
      salt: salt,
      createdAt: new Date().toISOString()
    };
  
  // Save to storage
  const users = getRegisteredUsers();
  users.push(newUser);
  saveUsers(users);
  
  // Return user object without password
  return {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    createdAt: new Date(newUser.createdAt)
  };
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(email: string, password: string): Promise<User> {
  // Validate input
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  
  // Add detailed logging for debugging mobile issues
  const browserInfo = detectMobileBrowser();
  logAuth.info(`Authentication attempt for ${email} on ${browserInfo.browserName}`);
  logAuth.info(`Mobile: ${browserInfo.isMobile}, LocalStorage: ${browserInfo.supportsLocalStorage}, SessionStorage: ${browserInfo.supportsSessionStorage}`);
  
  // Find user by email
  const users = getRegisteredUsers();
  logAuth.info(`Found ${users.length} registered users in storage`);
  
  const userIndex = users.findIndex(user => user.email.toLowerCase() === email.toLowerCase());
  
  if (userIndex === -1) {
    logAuth.warn(`User not found for email: ${email}`);
    throw new Error('Invalid email or password');
  }
  
  const storedUser = users[userIndex];
  logAuth.info(`Found user: ${storedUser.email} (ID: ${storedUser.id}) with password version: ${storedUser.passwordVersion}`);
  
  try {
    // Verify password using secure verification
    const passwordValid = await verifyPassword(password, storedUser.passwordHash, storedUser.salt || '', storedUser.passwordVersion);
    
    if (!passwordValid) {
      logAuth.warn(`Password verification failed for user: ${storedUser.email}`);
      throw new Error('Invalid email or password');
    }
    
    logAuth.info(`Password verification successful for user: ${storedUser.email}`);
  } catch (error) {
    logAuth.error(`Password verification error for user: ${storedUser.email}`, error);
    throw new Error('Invalid email or password');
  }
  
  // Migrate legacy password to secure format if needed
  if (storedUser.passwordVersion === PASSWORD_VERSIONS.LEGACY) {
    try {
      logAuth.info(`Migrating legacy password for user: ${storedUser.email}`);
      const { hash, salt, version } = await hashPassword(password);
      users[userIndex].passwordHash = hash;
      users[userIndex].salt = salt;
      users[userIndex].passwordVersion = version;
      saveUsers(users);
      logger.info('Password migrated to secure format for user:', storedUser.email);
    } catch (error) {
      logger.warn('Failed to migrate password for user:', storedUser.email, error);
      // Continue with authentication even if migration fails
    }
  }
  
  // Return user object without password
  return {
    id: storedUser.id,
    email: storedUser.email,
    name: storedUser.name,
    createdAt: new Date(storedUser.createdAt)
  };
}

/**
 * Update user profile (name only, email cannot be changed)
 */
export function updateUserProfile(userId: string, name: string): User {
  if (!name || name.trim().length === 0) {
    throw new Error('Name is required');
  }
  
  const users = getRegisteredUsers();
  const userIndex = users.findIndex(user => user.id === userId);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  // Update user name
  users[userIndex].name = name.trim();
  saveUsers(users);
  
  // Return updated user object
  return {
    id: users[userIndex].id,
    email: users[userIndex].email,
    name: users[userIndex].name,
    createdAt: new Date(users[userIndex].createdAt)
  };
}

/**
 * Change user password
 */
export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  if (!currentPassword || !newPassword) {
    throw new Error('Current password and new password are required');
  }
  
  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long');
  }
  
  const users = getRegisteredUsers();
  const userIndex = users.findIndex(user => user.id === userId);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
      // Verify current password using secure verification
    if (!await verifyPassword(currentPassword, users[userIndex].passwordHash, users[userIndex].salt || '', users[userIndex].passwordVersion)) {
      throw new Error('Current password is incorrect');
    }
    
    // Update password
    const { hash, salt, version } = await hashPassword(newPassword);
    users[userIndex].passwordHash = hash;
    users[userIndex].passwordVersion = version;
    users[userIndex].salt = salt;
    saveUsers(users);
}

/**
 * Delete user account
 */
export async function deleteUser(userId: string, password: string): Promise<void> {
  if (!password) {
    throw new Error('Password is required to delete account');
  }
  
  const users = getRegisteredUsers();
  const userIndex = users.findIndex(user => user.id === userId);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
      // Verify password using secure verification
    if (!await verifyPassword(password, users[userIndex].passwordHash, users[userIndex].salt || '', users[userIndex].passwordVersion)) {
      throw new Error('Password is incorrect');
    }
  
  // Remove user from storage
  users.splice(userIndex, 1);
  saveUsers(users);
}

/**
 * Get all users (for admin purposes, returns users without password hashes)
 */
export function getAllUsers(): User[] {
  const users = getRegisteredUsers();
  return users.map(user => ({
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: new Date(user.createdAt)
  }));
}

/**
 * Clear all user data (for testing/reset purposes)
 */
export function clearAllUsers(): void {
  try {
    // Clear from localStorage
    try {
      localStorage.removeItem(USERS_STORAGE_KEY);
    } catch {
      logAuth.warn('Failed to clear localStorage users');
    }
    
    // Clear from sessionStorage
    try {
      sessionStorage.removeItem(USERS_STORAGE_KEY);
    } catch {
      logAuth.warn('Failed to clear sessionStorage users');
    }
  } catch (error) {
    logAuth.error('clearing users', error);
    throw new Error('Failed to clear user data');
  }
}

/**
 * Clear corrupted storage data and reset to clean state
 */
export function clearCorruptedStorage(): void {
  try {
    const browserInfo = detectMobileBrowser();
    
    // Clear all potentially corrupted data
    const keysToClear = [
      'task_manager_users',
      'task_manager_session',
      'task-manager-state',
      'task-manager-state-user_1755389080848_xfr7tnfnk',
      'legacy key for backward compatibility'
    ];
    
    // Clear from localStorage
    if (browserInfo.supportsLocalStorage) {
      keysToClear.forEach(key => {
        try {
          localStorage.removeItem(key);
          logger.info(`Cleared corrupted localStorage key: ${key}`);
        } catch (error) {
          logger.warn(`Failed to clear localStorage key ${key}:`, error);
        }
      });
    }
    
    // Clear from sessionStorage
    if (browserInfo.supportsSessionStorage) {
      keysToClear.forEach(key => {
        try {
          sessionStorage.removeItem(key);
          logger.info(`Cleared corrupted sessionStorage key: ${key}`);
        } catch (error) {
          logger.warn(`Failed to clear sessionStorage key ${key}:`, error);
        }
      });
    }
    
    logger.info('Storage corruption cleanup completed');
  } catch (error) {
    logger.error('Failed to clear corrupted storage:', error);
  }
}

/**
 * Get user count
 */
export function getUserCount(): number {
  return getRegisteredUsers().length;
}

/**
 * Check mobile browser compatibility and provide user-friendly error messages
 */
export function checkMobileCompatibility(): {
  isCompatible: boolean;
  issues: string[];
  recommendations: string[];
  errorMessage: string | null;
} {
  const compatibility = hasCompatibilityIssues();
  
  if (!compatibility.hasIssues) {
    return {
      isCompatible: true,
      issues: [],
      recommendations: [],
      errorMessage: null
    };
  }
  
  // Generate user-friendly error message
  const errorMessage = 'Your browser has some limitations. Please use a modern browser with storage support.';
  
  return {
    isCompatible: true, // We'll try to work around issues
    issues: compatibility.issues,
    recommendations: compatibility.recommendations,
    errorMessage
  };
}

/**
 * Debug function to check authentication state on mobile devices
 */
export function debugMobileAuthState(): {
  browserInfo: ReturnType<typeof detectMobileBrowser>;
  storageInfo: ReturnType<typeof getStorageUsageInfo>;
  userCount: number;
  sessionInfo: ReturnType<typeof getSessionInfo>;
} {
  const browserInfo = detectMobileBrowser();
  const storageInfo = getStorageUsageInfo();
  const userCount = getUserCount();
  const sessionInfo = getSessionInfo();
  
  // Log all debug information
  logAuth.info('=== MOBILE AUTH DEBUG INFO ===');
  logAuth.info('Browser:', browserInfo);
  logAuth.info('Storage:', storageInfo);
  logAuth.info('User count:', userCount);
  logAuth.info('Session:', sessionInfo);
  logAuth.info('=== END DEBUG INFO ===');
  
  return {
    browserInfo,
    storageInfo,
    userCount,
    sessionInfo
  };
}

/**
 * Get storage usage information
 */
export function getStorageUsageInfo(): {
  localStorageSize: number;
  sessionStorageSize: number;
  totalSize: number;
} {
  let localStorageSize = 0;
  let sessionStorageSize = 0;
  
  try {
    // Calculate localStorage size
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          localStorageSize += key.length + value.length;
        }
      }
    }
    
    // Calculate sessionStorage size
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        const value = sessionStorage.getItem(key);
        if (value) {
          sessionStorageSize += key.length + value.length;
        }
      }
    }
  } catch (error) {
    logger.warn('Error calculating storage usage:', error);
  }
  
  const totalSize = localStorageSize + sessionStorageSize;
  
  return {
    localStorageSize,
    sessionStorageSize,
    totalSize
  };
}

/**
 * Validate user session (check if user still exists in storage)
 */
export function validateUserSession(userId: string): boolean {
  const users = getRegisteredUsers();
  return users.some(user => user.id === userId);
}

/**
 * Validate stored authentication data
 */
function isValidAuthData(authData: unknown): boolean {
  try {
    // Check if authData has the required structure
    if (!authData || typeof authData !== 'object') {
      return false;
    }
    
    const auth = authData as Record<string, unknown>;
    
    // Check for required authentication properties
    if (typeof auth.isAuthenticated !== 'boolean') {
      return false;
    }
    
    // If authenticated, user object must exist and be valid
    if (auth.isAuthenticated) {
      if (!auth.user || typeof auth.user !== 'object') {
        return false;
      }
      
      const user = auth.user as Record<string, unknown>;
      
      // Validate user object properties
      if (!user.id || !user.email || !user.name) {
        return false;
      }
      
      // Check if user still exists in storage (for non-demo users)
      if (!auth.isDemoMode && !validateUserSession(user.id as string)) {
        return false;
      }
    }
    
    // Check demo mode flag
    if (typeof auth.isDemoMode !== 'boolean') {
      return false;
    }
    
    return true;
  } catch (error) {
    logAuth.error('Error validating auth data', error);
    return false;
  }
}

/**
 * Restore authentication state from storage
 */
export function restoreAuthState(): {
  user: User | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
} | null {
  try {
    // First try to get session data
    const session = getSession();
    
    if (session && isSessionValid(session)) {
      logAuth.session('restoring from session', session.userId);
      
      // For demo mode, return demo user
      if (session.isDemoMode) {
        return {
          user: {
            id: session.userId,
            email: session.email,
            name: session.name,
            createdAt: new Date(session.loginTime)
          },
          isAuthenticated: true,
          isDemoMode: true
        };
      }
      
      // For regular users, validate that user still exists
      if (validateUserSession(session.userId)) {
        return {
          user: {
            id: session.userId,
            email: session.email,
            name: session.name,
            createdAt: new Date(session.loginTime)
          },
          isAuthenticated: true,
          isDemoMode: false
        };
      } else {
        logAuth.session('user no longer exists, clearing session', session.userId);
        clearSession();
        return null;
      }
    }
    
    // If no valid session, try to restore from localStorage as fallback
    const storedAuth = localStorage.getItem('task_manager_auth_state');
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        if (isValidAuthData(authData)) {
          logAuth.info('Restored auth state from localStorage');
          return authData;
        } else {
          logAuth.warn('Invalid auth data found in localStorage, clearing');
          localStorage.removeItem('task_manager_auth_state');
        }
      } catch (error) {
        logAuth.error('Error parsing stored auth data', error);
        localStorage.removeItem('task_manager_auth_state');
      }
    }
    
    return null;
  } catch (error) {
    logAuth.error('Error restoring auth state', error);
    return null;
  }
}

/**
 * Save authentication state to storage for persistence
 */
export function saveAuthState(authState: {
  user: User | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
}): void {
  try {
    // Save to localStorage as backup
    localStorage.setItem('task_manager_auth_state', JSON.stringify(authState));
    logAuth.info('Saved auth state to localStorage');
  } catch (error) {
    logAuth.error('Error saving auth state to localStorage', error);
  }
}

/**
 * Clear authentication state from storage
 */
export function clearAuthState(): void {
  try {
    // Clear session data
    clearSession();
    
    // Clear localStorage auth state
    localStorage.removeItem('task_manager_auth_state');
    
    logAuth.info('Cleared auth state from storage');
  } catch (error) {
    logAuth.error('Error clearing auth state', error);
  }
}
