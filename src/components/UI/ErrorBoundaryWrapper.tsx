import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { useApp } from '../../context/useApp';

interface ErrorBoundaryWrapperProps {
  children: React.ReactNode;
}

export function ErrorBoundaryWrapper({ children }: ErrorBoundaryWrapperProps) {
  const { state } = useApp();
  
  const appState = {
    tasks: state.tasks,
    projects: state.projects,
    goals: state.goals,
    authentication: state.authentication,
    searchQuery: state.searchQuery,
    selectedProject: state.selectedProject,
    selectedPriority: state.selectedPriority,
    userSettings: state.userSettings
  };

  return (
    <ErrorBoundary appState={appState}>
      {children}
    </ErrorBoundary>
  );
}
