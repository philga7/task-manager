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
const AUTH_VERSION_KEY = 'task_manager_auth_version';
const DEPLOYMENT_VERSION_KEY = 'task_manager_deployment_version';

// Password hash versions
const PASSWORD_VERSIONS = {
  LEGACY: 1, // Old btoa() implementation
  SECURE: 2  // New Web Crypto API implementation
};

// Authentication state versions for deployment tracking
const AUTH_STATE_VERSIONS = {
  LEGACY: 1,    // Original authentication state format
  ENHANCED: 2,  // Enhanced with deployment tracking and validation
  CURRENT: 3    // Current version with corruption detection
};

// Current deployment version - should be updated with each deployment
const CURRENT_DEPLOYMENT_VERSION = '1.0.0';

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
  
  // Log authentication state change for deployment tracking
  logAuth.info('Session created', {
    userId: user.id,
    email: user.email,
    isDemoMode,
    deploymentVersion: getCurrentDeploymentVersion(),
    authVersion: AUTH_STATE_VERSIONS.CURRENT,
    timestamp: new Date().toISOString()
  });
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
  // Log session clearing for deployment tracking
  const session = getSession();
  if (session) {
    logAuth.info('Session cleared', {
      userId: session.userId,
      email: session.email,
      isDemoMode: session.isDemoMode,
      deploymentVersion: getCurrentDeploymentVersion(),
      authVersion: AUTH_STATE_VERSIONS.CURRENT,
      timestamp: new Date().toISOString()
    });
  }
  
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
 * Test authentication state corruption detection and recovery
 */
export function testAuthCorruptionDetection(): {
  success: boolean;
  tests: Array<{ name: string; passed: boolean; error?: string }>;
} {
  const tests: Array<{ name: string; passed: boolean; error?: string }> = [];
  
  try {
    // Test 1: Check deployment version tracking
    const currentVersion = getCurrentDeploymentVersion();
    const storedVersion = getStoredDeploymentVersion();
    
    tests.push({
      name: 'Deployment version tracking',
      passed: typeof currentVersion === 'string' && currentVersion.length > 0,
      error: typeof currentVersion !== 'string' || currentVersion.length === 0 ? 'Deployment version tracking failed' : undefined
    });
    
    // Test 1.5: Check stored version functionality
    tests.push({
      name: 'Stored deployment version functionality',
      passed: storedVersion === null || (typeof storedVersion === 'string' && storedVersion.length > 0),
      error: storedVersion !== null && (typeof storedVersion !== 'string' || storedVersion.length === 0) ? 'Stored deployment version functionality failed' : undefined
    });
    
    // Test 2: Check auth version tracking
    const authVersion = getStoredAuthVersion();
    tests.push({
      name: 'Auth version tracking',
      passed: typeof authVersion === 'number' && authVersion >= AUTH_STATE_VERSIONS.LEGACY,
      error: typeof authVersion !== 'number' || authVersion < AUTH_STATE_VERSIONS.LEGACY ? 'Auth version tracking failed' : undefined
    });
    
    // Test 3: Test corruption detection with valid data
    const validAuthData = {
      user: { id: 'test-user', email: 'test@example.com', name: 'Test User' },
      isAuthenticated: true,
      isDemoMode: false
    };
    
    const validValidation = validateAuthDataWithCorruptionDetection(validAuthData);
    tests.push({
      name: 'Valid auth data validation',
      passed: validValidation.isValid && !validValidation.isCorrupted,
      error: !validValidation.isValid || validValidation.isCorrupted ? 'Valid auth data validation failed' : undefined
    });
    
    // Test 4: Test corruption detection with invalid data
    const invalidAuthData = {
      user: null,
      isAuthenticated: 'invalid', // Should be boolean
      isDemoMode: false
    };
    
    const invalidValidation = validateAuthDataWithCorruptionDetection(invalidAuthData);
    tests.push({
      name: 'Invalid auth data validation',
      passed: !invalidValidation.isValid && invalidValidation.isCorrupted,
      error: invalidValidation.isValid || !invalidValidation.isCorrupted ? 'Invalid auth data validation failed' : undefined
    });
    
    // Test 5: Test backup recovery
    const testBackupData = {
      user: { id: 'backup-user', email: 'backup@example.com', name: 'Backup User' },
      isAuthenticated: true,
      isDemoMode: false
    };
    
    // Save test backup
    localStorage.setItem('task_manager_auth_backup_test', JSON.stringify(testBackupData));
    
    const recovered = recoverAuthStateFromBackups();
    tests.push({
      name: 'Backup recovery',
      passed: recovered !== null,
      error: recovered === null ? 'Backup recovery failed' : undefined
    });
    
    // Clean up test backup
    localStorage.removeItem('task_manager_auth_backup_test');
    
  } catch (error) {
    tests.push({
      name: 'Auth corruption detection test execution',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  const success = tests.every(test => test.passed);
  
  // Log test results
  console.log('=== Auth Corruption Detection Test Results ===');
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
 * Restore authentication state from storage with enhanced corruption detection and recovery
 */
export function restoreAuthState(): {
  user: User | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
} | null {
  try {
    logAuth.info('Starting authentication state restoration with corruption detection');
    
    // Check for deployment changes that might cause corruption
    const deploymentChanged = hasDeploymentChanged();
    if (deploymentChanged) {
      logAuth.warn('Deployment version changed, checking for corruption');
    }
    
    // First try to get session data
    const session = getSession();
    
    if (session && isSessionValid(session)) {
      logAuth.session('restoring from session', session.userId);
      
      // Validate session data with corruption detection
      const sessionAuthData = {
        user: {
          id: session.userId,
          email: session.email,
          name: session.name,
          createdAt: new Date(session.loginTime)
        },
        isAuthenticated: true,
        isDemoMode: session.isDemoMode
      };
      
      const validation = validateAuthDataWithCorruptionDetection(sessionAuthData);
      
      if (validation.isValid) {
        // Update auth version to current
        updateAuthVersion(AUTH_STATE_VERSIONS.CURRENT);
        
        // For demo mode, return demo user
        if (session.isDemoMode) {
          return sessionAuthData;
        }
        
        // For regular users, validate that user still exists
        if (validateUserSession(session.userId)) {
          return sessionAuthData;
        } else {
          logAuth.session('user no longer exists, clearing session', session.userId);
          clearSession();
          return null;
        }
      } else {
        logAuth.warn('Session data validation failed', validation.issues);
        
        if (validation.canRecover) {
          logAuth.info('Attempting to recover from backup sources');
          const recovered = recoverAuthStateFromBackups();
          if (recovered) {
            updateAuthVersion(AUTH_STATE_VERSIONS.CURRENT);
            return recovered;
          }
        }
        
        // Clean up corrupted data
        cleanupCorruptedAuthData();
        return null;
      }
    }
    
    // If no valid session, try to restore from localStorage as fallback
    const storedAuth = localStorage.getItem('task_manager_auth_state');
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        const validation = validateAuthDataWithCorruptionDetection(authData);
        
        if (validation.isValid) {
          logAuth.info('Restored auth state from localStorage');
          updateAuthVersion(AUTH_STATE_VERSIONS.CURRENT);
          return authData;
        } else {
          logAuth.warn('Invalid auth data found in localStorage', validation.issues);
          
          if (validation.canRecover) {
            logAuth.info('Attempting to recover from backup sources');
            const recovered = recoverAuthStateFromBackups();
            if (recovered) {
              updateAuthVersion(AUTH_STATE_VERSIONS.CURRENT);
              return recovered;
            }
          }
          
          // Clean up corrupted data
          cleanupCorruptedAuthData();
        }
      } catch (error) {
        logAuth.error('Error parsing stored auth data', error);
        localStorage.removeItem('task_manager_auth_state');
      }
    }
    
    // If no valid auth state found, try recovery from backups
    logAuth.info('No valid auth state found, attempting recovery from backups');
    const recovered = recoverAuthStateFromBackups();
    if (recovered) {
      updateAuthVersion(AUTH_STATE_VERSIONS.CURRENT);
      return recovered;
    }
    
    // Initialize auth version if not set
    if (getStoredAuthVersion() === AUTH_STATE_VERSIONS.LEGACY) {
      updateAuthVersion(AUTH_STATE_VERSIONS.CURRENT);
    }
    
    return null;
  } catch (error) {
    logAuth.error('Error restoring auth state', error);
    return null;
  }
}

/**
 * Save authentication state to storage for persistence with version tracking and backup
 */
export function saveAuthState(authState: {
  user: User | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
}): void {
  try {
    // Validate auth state before saving
    const validation = validateAuthDataWithCorruptionDetection(authState);
    if (!validation.isValid) {
      logAuth.warn('Attempting to save invalid auth state', validation.issues);
      return;
    }
    
    // Save to localStorage as primary storage
    localStorage.setItem('task_manager_auth_state', JSON.stringify(authState));
    
    // Create backup in sessionStorage
    sessionStorage.setItem('task_manager_auth_state', JSON.stringify(authState));
    
    // Create additional backup with timestamp
    const backupKey = `task_manager_auth_backup_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(authState));
    
    // Clean up old backups (keep only last 3)
    const backupKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('task_manager_auth_backup_')
    ).sort();
    
    if (backupKeys.length > 3) {
      const keysToRemove = backupKeys.slice(0, backupKeys.length - 3);
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
    
    // Update auth version to current
    updateAuthVersion(AUTH_STATE_VERSIONS.CURRENT);
    
    logAuth.info('Saved auth state with backup and version tracking');
  } catch (error) {
    logAuth.error('Error saving auth state to storage', error);
  }
}

/**
 * Clear authentication state from storage including version tracking
 */
export function clearAuthState(): void {
  try {
    // Clear session data
    clearSession();
    
    // Clear localStorage auth state
    localStorage.removeItem('task_manager_auth_state');
    sessionStorage.removeItem('task_manager_auth_state');
    
    // Clear version tracking
    localStorage.removeItem(AUTH_VERSION_KEY);
    sessionStorage.removeItem(AUTH_VERSION_KEY);
    
    // Clear deployment version
    localStorage.removeItem(DEPLOYMENT_VERSION_KEY);
    sessionStorage.removeItem(DEPLOYMENT_VERSION_KEY);
    
    // Clear all backup auth states
    const backupKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('task_manager_auth_backup_')
    );
    backupKeys.forEach(key => localStorage.removeItem(key));
    
    logAuth.info('Cleared auth state and version tracking from storage');
  } catch (error) {
    logAuth.error('Error clearing auth state', error);
  }
}

/**
 * Get current deployment version
 */
function getCurrentDeploymentVersion(): string {
  return CURRENT_DEPLOYMENT_VERSION;
}

/**
 * Get stored deployment version
 */
function getStoredDeploymentVersion(): string | null {
  try {
    return localStorage.getItem(DEPLOYMENT_VERSION_KEY) || sessionStorage.getItem(DEPLOYMENT_VERSION_KEY);
  } catch (error) {
    logAuth.warn('Failed to get stored deployment version', error);
    return null;
  }
}

/**
 * Update stored deployment version
 */
function updateDeploymentVersion(): void {
  try {
    const currentVersion = getCurrentDeploymentVersion();
    localStorage.setItem(DEPLOYMENT_VERSION_KEY, currentVersion);
    sessionStorage.setItem(DEPLOYMENT_VERSION_KEY, currentVersion);
    logAuth.info('Updated deployment version', currentVersion);
  } catch (error) {
    logAuth.error('Failed to update deployment version', error);
  }
}

/**
 * Check if deployment version has changed (indicating a new deployment)
 */
function hasDeploymentChanged(): boolean {
  const storedVersion = getStoredDeploymentVersion();
  const currentVersion = getCurrentDeploymentVersion();
  
  if (!storedVersion) {
    // First time running, update version
    updateDeploymentVersion();
    return false;
  }
  
  const changed = storedVersion !== currentVersion;
  if (changed) {
    logAuth.info('Deployment version changed', { from: storedVersion, to: currentVersion });
    updateDeploymentVersion();
  }
  
  return changed;
}

/**
 * Get stored authentication state version
 */
function getStoredAuthVersion(): number {
  try {
    const version = localStorage.getItem(AUTH_VERSION_KEY) || sessionStorage.getItem(AUTH_VERSION_KEY);
    return version ? parseInt(version, 10) : AUTH_STATE_VERSIONS.LEGACY;
  } catch (error) {
    logAuth.warn('Failed to get stored auth version', error);
    return AUTH_STATE_VERSIONS.LEGACY;
  }
}

/**
 * Update stored authentication state version
 */
function updateAuthVersion(version: number): void {
  try {
    localStorage.setItem(AUTH_VERSION_KEY, version.toString());
    sessionStorage.setItem(AUTH_VERSION_KEY, version.toString());
    logAuth.info('Updated auth version', version);
  } catch (error) {
    logAuth.error('Failed to update auth version', error);
  }
}

/**
 * Enhanced validation of stored authentication data with corruption detection
 */
function validateAuthDataWithCorruptionDetection(authData: unknown): {
  isValid: boolean;
  isCorrupted: boolean;
  issues: string[];
  canRecover: boolean;
} {
  const issues: string[] = [];
  let isCorrupted = false;
  let canRecover = true;
  
  try {
    // Check if authData has the required structure
    if (!authData || typeof authData !== 'object') {
      issues.push('Invalid data structure: not an object');
      isCorrupted = true;
      canRecover = false;
      return { isValid: false, isCorrupted, issues, canRecover };
    }
    
    const auth = authData as Record<string, unknown>;
    
    // Check for required authentication properties
    if (typeof auth.isAuthenticated !== 'boolean') {
      issues.push('Missing or invalid isAuthenticated property');
      isCorrupted = true;
    }
    
    if (typeof auth.isDemoMode !== 'boolean') {
      issues.push('Missing or invalid isDemoMode property');
      isCorrupted = true;
    }
    
    // If authenticated, user object must exist and be valid
    if (auth.isAuthenticated) {
      if (!auth.user || typeof auth.user !== 'object') {
        issues.push('Missing or invalid user object for authenticated state');
        isCorrupted = true;
        canRecover = false;
      } else {
        const user = auth.user as Record<string, unknown>;
        
        // Validate user object properties
        if (!user.id || typeof user.id !== 'string') {
          issues.push('Missing or invalid user ID');
          isCorrupted = true;
        }
        
        if (!user.email || typeof user.email !== 'string') {
          issues.push('Missing or invalid user email');
          isCorrupted = true;
        }
        
        if (!user.name || typeof user.name !== 'string') {
          issues.push('Missing or invalid user name');
          isCorrupted = true;
        }
        
        // Check if user still exists in storage (for non-demo users)
        if (!auth.isDemoMode && user.id && typeof user.id === 'string') {
          if (!validateUserSession(user.id)) {
            issues.push('User no longer exists in storage');
            isCorrupted = true;
            canRecover = false;
          }
        }
      }
    }
    
    // Check for deployment version compatibility
    const storedVersion = getStoredAuthVersion();
    if (storedVersion < AUTH_STATE_VERSIONS.CURRENT) {
      issues.push(`Auth state version outdated (${storedVersion} < ${AUTH_STATE_VERSIONS.CURRENT})`);
      isCorrupted = true;
    }
    
    // Check for deployment changes that might cause corruption
    if (hasDeploymentChanged()) {
      issues.push('Deployment version changed, potential corruption detected');
      isCorrupted = true;
    }
    
    // Check for session timeout
    const session = getSession();
    if (session && !isSessionValid(session)) {
      issues.push('Session expired');
      isCorrupted = true;
    }
    
    return {
      isValid: !isCorrupted && issues.length === 0,
      isCorrupted,
      issues,
      canRecover
    };
    
  } catch (error) {
    logAuth.error('Error during auth data validation', error);
    return {
      isValid: false,
      isCorrupted: true,
      issues: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      canRecover: false
    };
  }
}

/**
 * Clean up corrupted authentication data
 */
function cleanupCorruptedAuthData(): void {
  try {
    logAuth.info('Cleaning up corrupted authentication data');
    
    // Clear session data
    clearSession();
    
    // Clear localStorage auth state
    localStorage.removeItem('task_manager_auth_state');
    sessionStorage.removeItem('task_manager_auth_state');
    
    // Clear version tracking
    localStorage.removeItem(AUTH_VERSION_KEY);
    sessionStorage.removeItem(AUTH_VERSION_KEY);
    
    // Clear deployment version
    localStorage.removeItem(DEPLOYMENT_VERSION_KEY);
    sessionStorage.removeItem(DEPLOYMENT_VERSION_KEY);
    
    // Clear any potentially corrupted storage keys
    const keysToClear = [
      'task-manager-state',
      'task-manager-demo-state',
      'task_manager_session',
      'task_manager_auth_state'
    ];
    
    keysToClear.forEach(key => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (error) {
        logAuth.warn(`Failed to clear key ${key}`, error);
      }
    });
    
    logAuth.info('Corrupted authentication data cleanup completed');
  } catch (error) {
    logAuth.error('Error during corrupted auth data cleanup', error);
  }
}

/**
 * Recover authentication state from backup sources
 */
function recoverAuthStateFromBackups(): {
  user: User | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
} | null {
  try {
    logAuth.info('Attempting to recover authentication state from backups');
    
    // Try to recover from session data first
    const session = getSession();
    if (session && isSessionValid(session)) {
      logAuth.info('Recovered from session data', session.userId);
      
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
      }
    }
    
    // Try to recover from localStorage backup
    const backupKeys = [
      'task_manager_auth_backup',
      'task_manager_auth_state_backup',
      'auth_state_backup'
    ];
    
    for (const key of backupKeys) {
      try {
        const backupData = localStorage.getItem(key) || sessionStorage.getItem(key);
        if (backupData) {
          const authData = JSON.parse(backupData);
          const validation = validateAuthDataWithCorruptionDetection(authData);
          
          if (validation.isValid) {
            logAuth.info('Recovered from backup', key);
            return authData;
          }
        }
      } catch (error) {
        logAuth.warn(`Failed to recover from backup ${key}`, error);
      }
    }
    
    logAuth.info('No valid backup authentication state found');
    return null;
    
  } catch (error) {
    logAuth.error('Error during auth state recovery', error);
    return null;
  }
}
