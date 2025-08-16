import React, { useState, useEffect } from 'react';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';
import { X, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginFormProps {
  onClose: () => void;
  onSwitchToRegister: () => void;
  onSubmit: (email: string, password: string) => void;
  isLoading?: boolean;
  error?: string;
}

export function LoginForm({ onClose, onSwitchToRegister, onSubmit, isLoading = false, error }: LoginFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData.email, formData.password);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Clear authentication error when form data changes
  useEffect(() => {
    if (error && (formData.email || formData.password)) {
      // The parent component should handle clearing the error
      // This is just a note for future enhancement
    }
  }, [formData.email, formData.password, error]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg md:text-xl font-semibold text-stone-100">
            Sign In
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-stone-500 hover:text-stone-300 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-300 text-sm flex items-start space-x-2" role="alert" aria-live="polite">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs md:text-sm font-medium text-stone-300 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-3 py-2 border bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm md:text-base placeholder-stone-500 ${
                validationErrors.email ? 'border-red-600' : 'border-stone-700'
              }`}
              style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
              placeholder="Enter your email..."
              disabled={isLoading}
            />
            {validationErrors.email && (
              <p className="mt-1 text-xs text-red-400">{validationErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-stone-300 mb-2">
              <Lock className="w-4 h-4 inline mr-1" />
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full px-3 py-2 pr-10 border bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm md:text-base placeholder-stone-500 ${
                  validationErrors.password ? 'border-red-600' : 'border-stone-700'
                }`}
                style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
                placeholder="Enter your password..."
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {validationErrors.password && (
              <p className="mt-1 text-xs text-red-400">{validationErrors.password}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>

          <div className="text-center pt-4 border-t border-stone-800">
            <p className="text-sm text-stone-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-amber-500 hover:text-amber-400 font-medium transition-colors"
                disabled={isLoading}
              >
                Sign up
              </button>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}
