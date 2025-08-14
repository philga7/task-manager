import React from 'react';
import { AlertTriangle, Info, XCircle } from 'lucide-react';
import { ValidationError } from '../../utils/validation';

interface ValidationErrorsProps {
  errors: ValidationError[];
  warnings?: ValidationError[];
  onDismiss?: () => void;
  className?: string;
}

export function ValidationErrors({ 
  errors, 
  warnings = [], 
  onDismiss, 
  className = '' 
}: ValidationErrorsProps) {
  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-red-300 mb-2">
                Please fix the following errors:
              </h4>
              <ul className="space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-200">
                    <span className="font-medium">{error.field}:</span> {error.message}
                  </li>
                ))}
              </ul>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-amber-300 mb-2">
                Please review the following warnings:
              </h4>
              <ul className="space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-amber-200">
                    <span className="font-medium">{warning.field}:</span> {warning.message}
                  </li>
                ))}
              </ul>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-amber-400 hover:text-amber-300 transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ValidationInfoProps {
  message: string;
  type?: 'info' | 'success';
  onDismiss?: () => void;
  className?: string;
}

export function ValidationInfo({ 
  message, 
  type = 'info', 
  onDismiss, 
  className = '' 
}: ValidationInfoProps) {
  const isSuccess = type === 'success';
  
  return (
    <div className={`bg-${isSuccess ? 'green' : 'blue'}-900/20 border border-${isSuccess ? 'green' : 'blue'}-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <Info className={`w-5 h-5 text-${isSuccess ? 'green' : 'blue'}-400 mt-0.5 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm text-${isSuccess ? 'green' : 'blue'}-200`}>
            {message}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`text-${isSuccess ? 'green' : 'blue'}-400 hover:text-${isSuccess ? 'green' : 'blue'}-300 transition-colors`}
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
