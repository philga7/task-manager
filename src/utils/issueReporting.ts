import { detectMobileBrowser } from './mobileDetection';
import { getStorageUsageInfo } from './auth';
import { logger } from './logger';
import { Task, Project, Goal, UserSettings, AuthenticationState } from '../types';

export interface AppState {
  tasks: Task[];
  projects: Project[];
  goals: Goal[];
  authentication: AuthenticationState;
  searchQuery: string;
  selectedProject: string | null;
  selectedPriority: string | null;
  userSettings: UserSettings;
}

export interface IssueReport {
  id: string;
  timestamp: string;
  type: 'silent-failure' | 'error' | 'user-reported';
  category: 'task-visibility' | 'authentication' | 'data-persistence' | 'ui-rendering' | 'performance' | 'other';
  title: string;
  description: string;
  userContext: {
    browser: {
      name: string;
      version: string;
      isMobile: boolean;
      userAgent: string;
      supportsLocalStorage: boolean;
      supportsSessionStorage: boolean;
    };
    appState: {
      isAuthenticated: boolean;
      isDemoMode: boolean;
      hasUser: boolean;
      taskCount: number;
      projectCount: number;
      goalCount: number;
      currentPage: string;
      searchQuery: string;
      selectedProject: string | null;
      selectedPriority: string | null;
    };
    storage: {
      localStorageSize: number;
      sessionStorageSize: number;
      totalSize: number;
    };
    url: string;
    viewport: {
      width: number;
      height: number;
    };
  };
  errorDetails?: {
    message: string;
    stack?: string;
    name: string;
  };
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  additionalNotes?: string;
}

/**
 * Collect comprehensive browser and environment information
 */
export function collectBrowserInfo() {
  const browserInfo = detectMobileBrowser();
  const storageInfo = getStorageUsageInfo();
  
  return {
    browser: {
      name: browserInfo.browserName,
      version: getBrowserVersion(),
      isMobile: browserInfo.isMobile,
      userAgent: navigator.userAgent,
      supportsLocalStorage: browserInfo.supportsLocalStorage,
      supportsSessionStorage: browserInfo.supportsSessionStorage,
    },
    storage: storageInfo,
    url: window.location.href,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    }
  };
}

/**
 * Get browser version from user agent
 */
function getBrowserVersion(): string {
  const userAgent = navigator.userAgent;
  
  // Safari
  if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
    const match = userAgent.match(/Version\/(\d+\.\d+)/);
    return match ? match[1] : 'Unknown';
  }
  
  // Chrome
  if (/Chrome/.test(userAgent)) {
    const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
    return match ? match[1] : 'Unknown';
  }
  
  // Firefox
  if (/Firefox/.test(userAgent)) {
    const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
    return match ? match[1] : 'Unknown';
  }
  
  // Edge
  if (/Edg/.test(userAgent)) {
    const match = userAgent.match(/Edg\/(\d+\.\d+)/);
    return match ? match[1] : 'Unknown';
  }
  
  return 'Unknown';
}

/**
 * Collect current app state for issue reporting
 */
export function collectAppState(state: AppState, currentPage: string = 'unknown'): {
  isAuthenticated: boolean;
  isDemoMode: boolean;
  hasUser: boolean;
  taskCount: number;
  projectCount: number;
  goalCount: number;
  currentPage: string;
  searchQuery: string;
  selectedProject: string | null;
  selectedPriority: string | null;
} {
  return {
    isAuthenticated: state.authentication.isAuthenticated,
    isDemoMode: state.authentication.isDemoMode,
    hasUser: !!state.authentication.user,
    taskCount: state.tasks.length,
    projectCount: state.projects.length,
    goalCount: state.goals.length,
    currentPage,
    searchQuery: state.searchQuery,
    selectedProject: state.selectedProject,
    selectedPriority: state.selectedPriority,
  };
}

/**
 * Detect potential silent failures based on app state
 */
export function detectSilentFailures(state: AppState, currentPage: string): Array<{
  type: 'silent-failure';
  category: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}> {
  const failures: Array<{
    type: 'silent-failure';
    category: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }> = [];

  // Task visibility issues
  if (currentPage === 'tasks' && state.authentication.isAuthenticated && state.tasks.length === 0) {
    failures.push({
      type: 'silent-failure',
      category: 'task-visibility',
      title: 'No tasks visible for authenticated user',
      description: 'User is logged in but no tasks are displayed, which may indicate a data loading or rendering issue.',
      severity: 'high'
    });
  }

  // Authentication state inconsistencies
  if (state.authentication.isAuthenticated && !state.authentication.user) {
    failures.push({
      type: 'silent-failure',
      category: 'authentication',
      title: 'Authenticated but no user data',
      description: 'User appears to be authenticated but user data is missing.',
      severity: 'high'
    });
  }

  // Demo mode with real user data
  if (state.authentication.isDemoMode && state.authentication.user) {
    failures.push({
      type: 'silent-failure',
      category: 'authentication',
      title: 'Demo mode with user data',
      description: 'Demo mode is active but user data is present, which may indicate a state management issue.',
      severity: 'medium'
    });
  }

  // Storage issues
  const storageInfo = getStorageUsageInfo();
  if (storageInfo.totalSize === 0 && state.authentication.isAuthenticated) {
    failures.push({
      type: 'silent-failure',
      category: 'data-persistence',
      title: 'No storage data for authenticated user',
      description: 'User is authenticated but no data is found in storage, which may indicate a storage or persistence issue.',
      severity: 'high'
    });
  }

  // UI rendering issues
  if (currentPage === 'tasks' && state.tasks.length > 0 && state.searchQuery === '' && state.selectedProject === null && state.selectedPriority === null) {
    // This is a basic check - in a real implementation, you might want to check if tasks are actually rendered
    // For now, we'll just log this as a potential issue
    logger.info('Potential UI rendering issue detected: tasks exist but may not be visible');
  }

  return failures;
}

/**
 * Generate a GitHub issue URL with pre-filled information
 */
export function generateGitHubIssueUrl(report: IssueReport): string {
  const baseUrl = 'https://github.com/your-username/task-manager/issues/new';
  
  const title = encodeURIComponent(report.title);
  const body = encodeURIComponent(generateIssueBody(report));
  
  return `${baseUrl}?title=${title}&body=${body}`;
}

/**
 * Generate the body content for a GitHub issue
 */
function generateIssueBody(report: IssueReport): string {
  const browser = report.userContext.browser;
  const appState = report.userContext.appState;
  
  let body = `## Issue Report\n\n`;
  body += `**Type:** ${report.type}\n`;
  body += `**Category:** ${report.category}\n`;
  body += `**Timestamp:** ${report.timestamp}\n\n`;
  
  body += `## Description\n\n`;
  body += `${report.description}\n\n`;
  
  body += `## Expected Behavior\n\n`;
  body += `${report.expectedBehavior}\n\n`;
  
  body += `## Actual Behavior\n\n`;
  body += `${report.actualBehavior}\n\n`;
  
  body += `## Steps to Reproduce\n\n`;
  report.stepsToReproduce.forEach((step, index) => {
    body += `${index + 1}. ${step}\n`;
  });
  body += `\n`;
  
  body += `## Environment\n\n`;
  body += `- **Browser:** ${browser.name} ${browser.version}\n`;
  body += `- **Mobile:** ${browser.isMobile ? 'Yes' : 'No'}\n`;
  body += `- **URL:** ${report.userContext.url}\n`;
  body += `- **Viewport:** ${report.userContext.viewport.width}x${report.userContext.viewport.height}\n`;
  body += `- **LocalStorage:** ${browser.supportsLocalStorage ? 'Supported' : 'Not Supported'}\n`;
  body += `- **SessionStorage:** ${browser.supportsSessionStorage ? 'Supported' : 'Not Supported'}\n\n`;
  
  body += `## App State\n\n`;
  body += `- **Authenticated:** ${appState.isAuthenticated}\n`;
  body += `- **Demo Mode:** ${appState.isDemoMode}\n`;
  body += `- **Has User:** ${appState.hasUser}\n`;
  body += `- **Tasks:** ${appState.taskCount}\n`;
  body += `- **Projects:** ${appState.projectCount}\n`;
  body += `- **Goals:** ${appState.goalCount}\n`;
  body += `- **Current Page:** ${appState.currentPage}\n`;
  body += `- **Search Query:** ${appState.searchQuery || 'None'}\n`;
  body += `- **Selected Project:** ${appState.selectedProject || 'None'}\n`;
  body += `- **Selected Priority:** ${appState.selectedPriority || 'None'}\n\n`;
  
  body += `## Storage\n\n`;
  body += `- **LocalStorage Size:** ${Math.round(report.userContext.storage.localStorageSize / 1024)}KB\n`;
  body += `- **SessionStorage Size:** ${Math.round(report.userContext.storage.sessionStorageSize / 1024)}KB\n`;
  body += `- **Total Size:** ${Math.round(report.userContext.storage.totalSize / 1024)}KB\n\n`;
  
  if (report.errorDetails) {
    body += `## Error Details\n\n`;
    body += `\`\`\`\n`;
    body += `Error: ${report.errorDetails.name}\n`;
    body += `Message: ${report.errorDetails.message}\n`;
    if (report.errorDetails.stack) {
      body += `Stack: ${report.errorDetails.stack}\n`;
    }
    body += `\`\`\`\n\n`;
  }
  
  if (report.additionalNotes) {
    body += `## Additional Notes\n\n`;
    body += `${report.additionalNotes}\n\n`;
  }
  
  body += `---\n`;
  body += `*This issue was automatically generated by the Task Manager app.*\n`;
  
  return body;
}

/**
 * Create a new issue report
 */
export function createIssueReport(params: {
  type: 'silent-failure' | 'error' | 'user-reported';
  category: string;
  title: string;
  description: string;
  expectedBehavior: string;
  actualBehavior: string;
  stepsToReproduce: string[];
  appState: AppState;
  currentPage: string;
  errorDetails?: {
    message: string;
    stack?: string;
    name: string;
  };
  additionalNotes?: string;
}): IssueReport {
  const browserInfo = collectBrowserInfo();
  const appStateInfo = collectAppState(params.appState, params.currentPage);
  
  return {
    id: `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    type: params.type,
    category: params.category as IssueReport['category'],
    title: params.title,
    description: params.description,
    userContext: {
      browser: browserInfo.browser,
      appState: appStateInfo,
      storage: browserInfo.storage,
      url: browserInfo.url,
      viewport: browserInfo.viewport,
    },
    errorDetails: params.errorDetails,
    stepsToReproduce: params.stepsToReproduce,
    expectedBehavior: params.expectedBehavior,
    actualBehavior: params.actualBehavior,
    additionalNotes: params.additionalNotes,
  };
}

/**
 * Save issue report to localStorage for later review
 */
export function saveIssueReport(report: IssueReport): void {
  try {
    const reports = getSavedIssueReports();
    reports.push(report);
    
    // Keep only the last 10 reports
    if (reports.length > 10) {
      reports.splice(0, reports.length - 10);
    }
    
    localStorage.setItem('task-manager-issue-reports', JSON.stringify(reports));
    logger.info('Issue report saved:', report.id);
  } catch (error) {
    logger.error('Failed to save issue report:', error);
  }
}

/**
 * Get saved issue reports from localStorage
 */
export function getSavedIssueReports(): IssueReport[] {
  try {
    const data = localStorage.getItem('task-manager-issue-reports');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    logger.error('Failed to load saved issue reports:', error);
    return [];
  }
}

/**
 * Clear saved issue reports
 */
export function clearSavedIssueReports(): void {
  try {
    localStorage.removeItem('task-manager-issue-reports');
    logger.info('Saved issue reports cleared');
  } catch (error) {
    logger.error('Failed to clear saved issue reports:', error);
  }
}
