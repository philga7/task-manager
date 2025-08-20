import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';
import { Button } from './Button';
import { logger } from '../../utils/logger';
import { createIssueReport, generateGitHubIssueUrl, saveIssueReport, type AppState } from '../../utils/issueReporting';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  appState?: AppState;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Create and save an issue report for this error
    try {
      const report = createIssueReport({
        type: 'error',
        category: 'ui-rendering',
        title: `Error: ${error.name}`,
        description: error.message,
        expectedBehavior: 'The application should work without errors',
        actualBehavior: `An error occurred: ${error.message}`,
        stepsToReproduce: ['The error occurred automatically'],
        appState: this.props.appState || {
          tasks: [],
          projects: [],
          goals: [],
          authentication: { isAuthenticated: false, isDemoMode: false },
          searchQuery: '',
          selectedProject: null,
          selectedPriority: null,
          userSettings: {}
        },
        currentPage: window.location.pathname,
        errorDetails: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      });
      
      saveIssueReport(report);
    } catch (reportError) {
      logger.error('Failed to create error report:', reportError);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-stone-800 rounded-lg border border-stone-700 p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-stone-100 mb-2">
              Something went wrong
            </h2>
            <p className="text-stone-400 mb-4">
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>
            <div className="space-y-2">
              <Button onClick={this.handleReset} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                Refresh Page
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => {
                  const report = createIssueReport({
                    type: 'error',
                    category: 'ui-rendering',
                    title: `Error: ${this.state.error?.name}`,
                    description: this.state.error?.message || 'Unknown error',
                    expectedBehavior: 'The application should work without errors',
                    actualBehavior: `An error occurred: ${this.state.error?.message}`,
                    stepsToReproduce: ['The error occurred automatically'],
                    appState: this.props.appState || {
                      tasks: [],
                      projects: [],
                      goals: [],
                      authentication: { isAuthenticated: false, isDemoMode: false },
                      searchQuery: '',
                      selectedProject: null,
                      selectedPriority: null,
                      userSettings: {}
                    },
                    currentPage: window.location.pathname,
                    errorDetails: {
                      message: this.state.error?.message || '',
                      stack: this.state.error?.stack,
                      name: this.state.error?.name || ''
                    }
                  });
                  
                  const url = generateGitHubIssueUrl(report);
                  window.open(url, '_blank');
                }}
                className="w-full"
              >
                <Bug className="w-4 h-4 mr-2" />
                Report This Error
              </Button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-stone-400 cursor-pointer hover:text-stone-300">
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-stone-700 rounded text-xs text-stone-300 overflow-auto">
                  <pre>{this.state.error.stack}</pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
