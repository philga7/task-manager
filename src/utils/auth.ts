import { User } from '../types';
import { detectMobileBrowser, hasCompatibilityIssues } from './mobileDetection';

// User storage interface for localStorage
interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
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

/**
 * Mobile-compatible password hashing function with fallback for btoa/atob
 * Note: This is for demo purposes only - in production, use proper cryptographic hashing
 */
function hashPassword(password: string): string {
  const salt = 'task_manager_salt_2024';
  const saltedPassword = password + salt;
  
  try {
    // Try btoa first (standard browsers)
    if (typeof btoa !== 'undefined') {
      return btoa(saltedPassword);
    } else {
      // Fallback for browsers without btoa (some mobile browsers)
      return encodeURIComponent(saltedPassword);
    }
  } catch (error) {
    console.warn('btoa not available, using fallback encoding:', error);
    return encodeURIComponent(saltedPassword);
  }
}

/**
 * Mobile-compatible password verification function
 */
function verifyPassword(password: string, hash: string): boolean {
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
    console.warn('atob not available, using fallback verification:', error);
    const expectedHash = encodeURIComponent(saltedPassword);
    return hash === expectedHash;
  }
}

/**
 * Get all registered users from storage with mobile browser compatibility
 */
function getRegisteredUsers(): StoredUser[] {
  try {
    const browserInfo = detectMobileBrowser();
    let usersData: string | null = null;
    
    // Try localStorage first
    if (browserInfo.supportsLocalStorage) {
      usersData = localStorage.getItem(USERS_STORAGE_KEY);
    }
    
    // Fallback to sessionStorage if localStorage fails
    if (!usersData && browserInfo.supportsSessionStorage) {
      usersData = sessionStorage.getItem(USERS_STORAGE_KEY);
    }
    
    if (!usersData) {
      return [];
    }
    
    const users = JSON.parse(usersData);
    if (!Array.isArray(users)) {
      console.warn('Invalid users data format, returning empty array');
      return [];
    }
    
    return users;
  } catch (error) {
    console.error('Error loading registered users:', error);
    return [];
  }
}

/**
 * Save users to storage with mobile browser compatibility
 */
function saveUsers(users: StoredUser[]): void {
  try {
    const browserInfo = detectMobileBrowser();
    const usersData = JSON.stringify(users);
    
    // Try localStorage first
    if (browserInfo.supportsLocalStorage) {
      localStorage.setItem(USERS_STORAGE_KEY, usersData);
      return;
    }
    
    // Fallback to sessionStorage
    if (browserInfo.supportsSessionStorage) {
      sessionStorage.setItem(USERS_STORAGE_KEY, usersData);
      return;
    }
    
    throw new Error('No compatible storage method available');
  } catch (error) {
    console.error('Error saving users to storage:', error);
    throw new Error('Failed to save user data to storage');
  }
}

/**
 * Save session data to storage with mobile browser compatibility
 */
function saveSession(sessionData: SessionData): void {
  try {
    const browserInfo = detectMobileBrowser();
    const sessionDataString = JSON.stringify(sessionData);
    
    // For private browsing, prefer sessionStorage
    if (browserInfo.isPrivateBrowsing && browserInfo.supportsSessionStorage) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionDataString);
      return;
    }
    
    // Try localStorage first
    if (browserInfo.supportsLocalStorage) {
      localStorage.setItem(SESSION_STORAGE_KEY, sessionDataString);
      return;
    }
    
    // Fallback to sessionStorage
    if (browserInfo.supportsSessionStorage) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionDataString);
      return;
    }
    
    throw new Error('No compatible storage method available');
  } catch (error) {
    console.error('Error saving session to storage:', error);
    throw new Error('Failed to save session data to storage');
  }
}

/**
 * Get session data from storage with mobile browser compatibility
 */
function getSession(): SessionData | null {
  try {
    const browserInfo = detectMobileBrowser();
    let sessionData: string | null = null;
    
    // For private browsing, check sessionStorage first
    if (browserInfo.isPrivateBrowsing && browserInfo.supportsSessionStorage) {
      sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);
    }
    
    // Try localStorage
    if (!sessionData && browserInfo.supportsLocalStorage) {
      sessionData = localStorage.getItem(SESSION_STORAGE_KEY);
    }
    
    // Fallback to sessionStorage
    if (!sessionData && browserInfo.supportsSessionStorage) {
      sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);
    }
    
    if (!sessionData) {
      return null;
    }
    
    const session = JSON.parse(sessionData);
    return session;
  } catch (error) {
    console.error('Error loading session from storage:', error);
    return null;
  }
}

/**
 * Clear session data from storage with mobile browser compatibility
 */
function clearSession(): void {
  try {
    const browserInfo = detectMobileBrowser();
    
    // Clear from localStorage
    if (browserInfo.supportsLocalStorage) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    
    // Clear from sessionStorage
    if (browserInfo.supportsSessionStorage) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error clearing session from storage:', error);
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
    console.log('Session expired, clearing session data');
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
    console.log('User no longer exists in storage, clearing session');
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
export function registerUser(email: string, password: string, name: string): User {
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
  const newUser: StoredUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email: email.toLowerCase(),
    name: name.trim(),
    passwordHash: hashPassword(password),
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
export function authenticateUser(email: string, password: string): User {
  // Validate input
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  
  // Find user by email
  const users = getRegisteredUsers();
  const storedUser = users.find(user => user.email.toLowerCase() === email.toLowerCase());
  
  if (!storedUser) {
    throw new Error('Invalid email or password');
  }
  
  // Verify password using mobile-compatible verification
  if (!verifyPassword(password, storedUser.passwordHash)) {
    throw new Error('Invalid email or password');
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
export function changePassword(userId: string, currentPassword: string, newPassword: string): void {
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
  
  // Verify current password using mobile-compatible verification
  if (!verifyPassword(currentPassword, users[userIndex].passwordHash)) {
    throw new Error('Current password is incorrect');
  }
  
  // Update password
  users[userIndex].passwordHash = hashPassword(newPassword);
  saveUsers(users);
}

/**
 * Delete user account
 */
export function deleteUser(userId: string, password: string): void {
  if (!password) {
    throw new Error('Password is required to delete account');
  }
  
  const users = getRegisteredUsers();
  const userIndex = users.findIndex(user => user.id === userId);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  // Verify password using mobile-compatible verification
  if (!verifyPassword(password, users[userIndex].passwordHash)) {
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
 * Clear all user data (for testing/reset purposes) with mobile browser compatibility
 */
export function clearAllUsers(): void {
  try {
    const browserInfo = detectMobileBrowser();
    
    // Clear from localStorage
    if (browserInfo.supportsLocalStorage) {
      localStorage.removeItem(USERS_STORAGE_KEY);
    }
    
    // Clear from sessionStorage
    if (browserInfo.supportsSessionStorage) {
      sessionStorage.removeItem(USERS_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error clearing users:', error);
    throw new Error('Failed to clear user data');
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
  const browserInfo = detectMobileBrowser();
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
  let errorMessage = 'Your browser has some limitations:';
  
  if (browserInfo.isIOS && browserInfo.isSafari && browserInfo.isPrivateBrowsing) {
    errorMessage = 'Private browsing mode detected. Some features may not work properly. Please use regular browsing mode for the best experience.';
  } else if (browserInfo.isIOS && browserInfo.isSafari) {
    errorMessage = 'iOS Safari detected. Storage is limited but the app should work. Consider using Chrome or Firefox for better performance.';
  } else if (browserInfo.isAndroid && browserInfo.isChrome) {
    errorMessage = 'Android Chrome detected. The app should work normally.';
  } else if (browserInfo.isMobile) {
    errorMessage = 'Mobile browser detected. Some features may be limited. Consider using a desktop browser for the best experience.';
  }
  
  return {
    isCompatible: true, // We'll try to work around issues
    issues: compatibility.issues,
    recommendations: compatibility.recommendations,
    errorMessage
  };
}

/**
 * Get storage usage information for mobile browsers
 */
export function getStorageUsageInfo(): {
  localStorageSize: number;
  sessionStorageSize: number;
  totalSize: number;
  quota: number | null;
  usagePercentage: number;
} {
  const browserInfo = detectMobileBrowser();
  let localStorageSize = 0;
  let sessionStorageSize = 0;
  
  try {
    if (browserInfo.supportsLocalStorage) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            localStorageSize += key.length + value.length;
          }
        }
      }
    }
    
    if (browserInfo.supportsSessionStorage) {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          const value = sessionStorage.getItem(key);
          if (value) {
            sessionStorageSize += key.length + value.length;
          }
        }
      }
    }
  } catch (error) {
    console.warn('Error calculating storage usage:', error);
  }
  
  const totalSize = localStorageSize + sessionStorageSize;
  const quota = browserInfo.storageQuota;
  const usagePercentage = quota ? (totalSize / quota) * 100 : 0;
  
  return {
    localStorageSize,
    sessionStorageSize,
    totalSize,
    quota,
    usagePercentage
  };
}

/**
 * Validate user session (check if user still exists in storage)
 */
export function validateUserSession(userId: string): boolean {
  const users = getRegisteredUsers();
  return users.some(user => user.id === userId);
}
