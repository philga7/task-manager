import React from 'react';
import { Play, AlertTriangle, Info } from 'lucide-react';
import { useApp } from '../../context/useApp';

interface DemoModeIndicatorProps {
  variant?: 'banner' | 'badge' | 'tooltip';
  showDetails?: boolean;
  className?: string;
}

export function DemoModeIndicator({ 
  variant = 'banner', 
  showDetails = true,
  className = '' 
}: DemoModeIndicatorProps) {
  const { state } = useApp();

  // Only show if in demo mode
  if (!state.authentication.isDemoMode) {
    return null;
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center space-x-2 px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded-lg text-xs font-medium text-amber-300 ${className}`}>
        <Play className="h-3 w-3" />
        <span>Demo Mode</span>
      </div>
    );
  }

  if (variant === 'tooltip') {
    return (
      <div className={`inline-flex items-center space-x-1 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-200 ${className}`}>
        <Info className="h-3 w-3" />
        <span>Demo</span>
      </div>
    );
  }

  // Default banner variant
  return (
    <div className={`bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <div className="flex items-center space-x-2 px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded">
              <Play className="h-3 w-3 text-amber-400" />
              <span className="text-xs font-medium text-amber-300">Demo Mode Active</span>
            </div>
          </div>
          {showDetails && (
            <p className="text-sm text-amber-200">
              You're currently viewing demo data. Your changes will not be saved permanently. 
              Create an account to save your personal data.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
