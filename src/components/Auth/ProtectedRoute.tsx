import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/useApp';
import { LoadingSpinner } from '../UI/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowDemoMode?: boolean;
  demoModeMessage?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowDemoMode = true,
  demoModeMessage = "You're currently in demo mode. Some features may be limited."
}) => {
  const { state } = useApp();
  const navigate = useNavigate();
  const { isAuthenticated, isDemoMode } = state.authentication;

  useEffect(() => {
    // If not authenticated and not in demo mode, redirect to settings
    if (!isAuthenticated && !isDemoMode) {
      navigate('/settings', { replace: true });
    }
  }, [isAuthenticated, isDemoMode, navigate]);

  // Show loading spinner while checking authentication
  if (!isAuthenticated && !isDemoMode) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-950">
        <LoadingSpinner />
      </div>
    );
  }

  // If in demo mode and demo mode is not allowed, redirect to settings
  if (isDemoMode && !allowDemoMode) {
    navigate('/settings', { replace: true });
    return null;
  }

  // If in demo mode and demo mode is allowed, show demo mode message
  if (isDemoMode && allowDemoMode) {
    return (
      <div className="min-h-screen bg-stone-950">
        <div className="bg-amber-900/20 border border-amber-500/30 text-amber-300 px-4 py-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">{demoModeMessage}</span>
            </div>
          </div>
        </div>
        {children}
      </div>
    );
  }

  // If authenticated, render the protected content
  return <>{children}</>;
};
