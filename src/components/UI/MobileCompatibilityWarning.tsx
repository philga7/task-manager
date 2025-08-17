import React, { useState } from 'react';
import { checkMobileCompatibility, getStorageUsageInfo } from '../../utils/auth';
import { detectMobileBrowser } from '../../utils/mobileDetection';

interface MobileCompatibilityWarningProps {
  onDismiss?: () => void;
}

export function MobileCompatibilityWarning({ onDismiss }: MobileCompatibilityWarningProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  const browserInfo = detectMobileBrowser();
  const compatibility = checkMobileCompatibility();
  const storageUsage = getStorageUsageInfo();
  
  // Don't show warning if no issues or already dismissed
  if (!compatibility.hasIssues || isDismissed) {
    return null;
  }
  
  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };
  
  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className="fixed top-4 left-4 right-4 z-50 bg-amber-50 border border-amber-200 rounded-lg shadow-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 text-amber-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h3 className="text-sm font-medium text-amber-800">
              Browser Compatibility Notice
            </h3>
          </div>
          
          <p className="text-sm text-amber-700 mb-3">
            {compatibility.errorMessage}
          </p>
          
          {isExpanded && (
            <div className="mt-3 space-y-2">
              <div className="text-xs text-amber-600">
                <strong>Browser:</strong> {browserInfo.browserName} {browserInfo.browserVersion} on {browserInfo.osName} {browserInfo.osVersion}
              </div>
              
              {browserInfo.isPrivateBrowsing && (
                <div className="text-xs text-amber-600">
                  <strong>Private Browsing:</strong> Some features may not work properly
                </div>
              )}
              
              {storageUsage.quota && (
                <div className="text-xs text-amber-600">
                  <strong>Storage Usage:</strong> {Math.round(storageUsage.usagePercentage)}% of {Math.round(storageUsage.quota / 1024 / 1024)}MB
                </div>
              )}
              
              {compatibility.recommendations.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs font-medium text-amber-800 mb-1">Recommendations:</div>
                  <ul className="text-xs text-amber-600 space-y-1">
                    {compatibility.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-amber-500 mr-1">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={handleExpand}
            className="text-amber-600 hover:text-amber-800 text-sm font-medium"
          >
            {isExpanded ? 'Show Less' : 'Show Details'}
          </button>
          
          <button
            onClick={handleDismiss}
            className="text-amber-600 hover:text-amber-800"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
