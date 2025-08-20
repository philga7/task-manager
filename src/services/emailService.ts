import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG, EmailTemplateParams } from '../config/emailjs';
import { IssueReport } from '../utils/issueReporting';
import { logger } from '../utils/logger';

// Initialize EmailJS with public key
export const initializeEmailJS = () => {
  if (EMAILJS_CONFIG.PUBLIC_KEY === 'YOUR_EMAILJS_PUBLIC_KEY') {
    logger.warn('EmailJS not configured. Please update src/config/emailjs.ts with your EmailJS credentials.');
    return false;
  }
  
  try {
    emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
    logger.info('EmailJS initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize EmailJS:', error);
    return false;
  }
};

// Check if EmailJS is properly configured
export const isEmailJSConfigured = (): boolean => {
  return (
    EMAILJS_CONFIG.PUBLIC_KEY !== 'YOUR_EMAILJS_PUBLIC_KEY' &&
    EMAILJS_CONFIG.SERVICE_ID !== 'YOUR_EMAILJS_SERVICE_ID' &&
    EMAILJS_CONFIG.TEMPLATE_ID !== 'YOUR_EMAILJS_TEMPLATE_ID'
  );
};

// Convert IssueReport to EmailJS template parameters
const convertReportToEmailParams = (report: IssueReport): EmailTemplateParams => {
  const browserInfo = `Browser: ${report.userContext.browser.name} ${report.userContext.browser.version}
Mobile: ${report.userContext.browser.isMobile ? 'Yes' : 'No'}
User Agent: ${report.userContext.browser.userAgent}
LocalStorage: ${report.userContext.browser.supportsLocalStorage ? 'Supported' : 'Not Supported'}
SessionStorage: ${report.userContext.browser.supportsSessionStorage ? 'Supported' : 'Not Supported'}
URL: ${report.userContext.url}
Viewport: ${report.userContext.viewport.width}x${report.userContext.viewport.height}`;

  const appState = `Authenticated: ${report.userContext.appState.isAuthenticated ? 'Yes' : 'No'}
Demo Mode: ${report.userContext.appState.isDemoMode ? 'Yes' : 'No'}
Has User: ${report.userContext.appState.hasUser ? 'Yes' : 'No'}
Tasks: ${report.userContext.appState.taskCount}
Projects: ${report.userContext.appState.projectCount}
Goals: ${report.userContext.appState.goalCount}
Current Page: ${report.userContext.appState.currentPage}
Search Query: ${report.userContext.appState.searchQuery || 'None'}
Selected Project: ${report.userContext.appState.selectedProject || 'None'}
Selected Priority: ${report.userContext.appState.selectedPriority || 'None'}
Storage: ${report.userContext.storage.totalSize}KB total`;

  const stepsToReproduce = report.stepsToReproduce.length > 0 
    ? report.stepsToReproduce.map((step, index) => `${index + 1}. ${step}`).join('\n')
    : 'No steps provided';

  return {
    to_email: 'phil@informedcrew.com',
    from_name: report.userContext.appState.hasUser ? 'Task Manager User' : 'Anonymous User',
    subject: `Task Manager Issue Report: ${report.title}`,
    issue_title: report.title,
    issue_category: report.category,
    issue_description: report.description,
    expected_behavior: report.expectedBehavior || 'Not specified',
    actual_behavior: report.actualBehavior || 'Not specified',
    steps_to_reproduce: stepsToReproduce,
    browser_info: browserInfo,
    app_state: appState,
    report_url: `GitHub Issue URL: ${generateGitHubIssueUrl(report)}`,
    timestamp: new Date(report.timestamp).toLocaleString(),
    additional_notes: report.additionalNotes
  };
};

// Helper function to generate GitHub issue URL (copied from issueReporting.ts to avoid circular dependency)
const generateGitHubIssueUrl = (report: IssueReport): string => {
  const baseUrl = 'https://github.com/your-username/task-manager/issues/new';
  const title = encodeURIComponent(report.title);
  const body = encodeURIComponent(`## Issue Report

**Type:** ${report.type}
**Category:** ${report.category}
**Timestamp:** ${report.timestamp}

## Description

${report.description}

## Expected Behavior

${report.expectedBehavior}

## Actual Behavior

${report.actualBehavior}

## Steps to Reproduce

${report.stepsToReproduce.map((step, index) => `${index + 1}. ${step}`).join('\n')}

## Environment

- **Browser:** ${report.userContext.browser.name} ${report.userContext.browser.version}
- **Mobile:** ${report.userContext.browser.isMobile ? 'Yes' : 'No'}
- **URL:** ${report.userContext.url}
- **Viewport:** ${report.userContext.viewport.width}x${report.userContext.viewport.height}
- **LocalStorage:** ${report.userContext.browser.supportsLocalStorage ? 'Supported' : 'Not Supported'}
- **SessionStorage:** ${report.userContext.browser.supportsSessionStorage ? 'Supported' : 'Not Supported'}

## App State

- **Authenticated:** ${report.userContext.appState.isAuthenticated}
- **Demo Mode:** ${report.userContext.appState.isDemoMode}
- **Has User:** ${report.userContext.appState.hasUser}
- **Tasks:** ${report.userContext.appState.taskCount}
- **Projects:** ${report.userContext.appState.projectCount}
- **Goals:** ${report.userContext.appState.goalCount}
- **Current Page:** ${report.userContext.appState.currentPage}
- **Search Query:** ${report.userContext.appState.searchQuery || 'None'}
- **Selected Project:** ${report.userContext.appState.selectedProject || 'None'}
- **Selected Priority:** ${report.userContext.appState.selectedPriority || 'None'}

## Storage

- **LocalStorage Size:** ${Math.round(report.userContext.storage.localStorageSize / 1024)}KB
- **SessionStorage Size:** ${Math.round(report.userContext.storage.sessionStorageSize / 1024)}KB
- **Total Size:** ${Math.round(report.userContext.storage.totalSize / 1024)}KB

${report.additionalNotes ? `\n## Additional Notes\n\n${report.additionalNotes}\n` : ''}
---
*This issue was automatically generated by the Task Manager app.*`);
  
  return `${baseUrl}?title=${title}&body=${body}`;
};

// Send issue report via EmailJS
export const sendIssueReportEmail = async (report: IssueReport): Promise<{
  success: boolean;
  message: string;
  error?: unknown;
}> => {
  if (!isEmailJSConfigured()) {
    return {
      success: false,
      message: 'EmailJS is not configured. Please set up your EmailJS credentials.'
    };
  }

  try {
    const templateParams = convertReportToEmailParams(report);
    
    logger.info('Sending issue report email via EmailJS...');
    
    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams
    );

    logger.info('Email sent successfully:', response);
    
    return {
      success: true,
      message: 'Issue report sent successfully via email!'
    };
  } catch (error) {
    logger.error('Failed to send email via EmailJS:', error);
    
    return {
      success: false,
      message: 'Failed to send email. Please try copying the report URL instead.',
      error
    };
  }
};

// Test EmailJS configuration
export const testEmailJSConfiguration = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  if (!isEmailJSConfigured()) {
    return {
      success: false,
      message: 'EmailJS is not configured'
    };
  }

  try {
    // Send a simple test email
    const testParams = {
      to_email: 'phil@informedcrew.com',
      from_name: 'Task Manager Test',
      subject: 'EmailJS Configuration Test',
      issue_title: 'Test Email',
      issue_category: 'Configuration Test',
      issue_description: 'This is a test email to verify EmailJS configuration.',
      expected_behavior: 'Email should be delivered',
      actual_behavior: 'Testing email delivery',
      steps_to_reproduce: '1. Configure EmailJS\n2. Send test email',
      browser_info: 'Test browser info',
      app_state: 'Test app state',
      report_url: 'Test report URL',
      timestamp: new Date().toLocaleString(),
      additional_notes: 'This is a configuration test email.'
    };

    await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      testParams
    );

    return {
      success: true,
      message: 'Test email sent successfully!'
    };
  } catch (error) {
    logger.error('EmailJS test failed:', error);
    return {
      success: false,
      message: `EmailJS test failed: ${error}`
    };
  }
};
