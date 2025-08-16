import { User } from '../types';

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
 * Simple password hashing function using btoa with salt
 * Note: This is for demo purposes only - in production, use proper cryptographic hashing
 */
function hashPassword(password: string): string {
  const salt = 'task_manager_salt_2024';
  const saltedPassword = password + salt;
  return btoa(saltedPassword);
}

/**
 * Get all registered users from localStorage
 */
function getRegisteredUsers(): StoredUser[] {
  try {
    const usersData = localStorage.getItem(USERS_STORAGE_KEY);
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
 * Save users to localStorage
 */
function saveUsers(users: StoredUser[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users to localStorage:', error);
    throw new Error('Failed to save user data to storage');
  }
}

/**
 * Save session data to localStorage
 */
function saveSession(sessionData: SessionData): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
  } catch (error) {
    console.error('Error saving session to localStorage:', error);
    throw new Error('Failed to save session data to storage');
  }
}

/**
 * Get session data from localStorage
 */
function getSession(): SessionData | null {
  try {
    const sessionData = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionData) {
      return null;
    }
    
    const session = JSON.parse(sessionData);
    return session;
  } catch (error) {
    console.error('Error loading session from localStorage:', error);
    return null;
  }
}

/**
 * Clear session data from localStorage
 */
function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing session from localStorage:', error);
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
  
  // Verify password
  const providedPasswordHash = hashPassword(password);
  if (storedUser.passwordHash !== providedPasswordHash) {
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
  
  // Verify current password
  const currentPasswordHash = hashPassword(currentPassword);
  if (users[userIndex].passwordHash !== currentPasswordHash) {
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
  
  // Verify password
  const passwordHash = hashPassword(password);
  if (users[userIndex].passwordHash !== passwordHash) {
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
    localStorage.removeItem(USERS_STORAGE_KEY);
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
 * Validate user session (check if user still exists in storage)
 */
export function validateUserSession(userId: string): boolean {
  const users = getRegisteredUsers();
  return users.some(user => user.id === userId);
}
