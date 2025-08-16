import React, { useState, useEffect } from 'react';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';
import { X, Mail, Lock, Eye, EyeOff, User, CheckCircle, AlertCircle } from 'lucide-react';

interface RegisterFormProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
  onSubmit: (name: string, email: string, password: string) => void;
  isLoading?: boolean;
  error?: string;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
}

export function RegisterForm({ onClose, onSwitchToLogin, onSubmit, isLoading = false, error }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const validatePasswordStrength = (password: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('At least 8 characters');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('At least one lowercase letter');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('At least one uppercase letter');
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('At least one number');
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('At least one special character');
    }

    return { score, feedback };
  };

  const getPasswordStrengthColor = (score: number) => {
    if (score <= 2) return 'text-red-400';
    if (score <= 3) return 'text-yellow-400';
    if (score <= 4) return 'text-blue-400';
    return 'text-green-400';
  };

  const getPasswordStrengthText = (score: number) => {
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    }

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

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData.name, formData.email, formData.password);
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
    if (error && (formData.name || formData.email || formData.password)) {
      // The parent component should handle clearing the error
      // This is just a note for future enhancement
    }
  }, [formData.name, formData.email, formData.password, error]);

  const passwordStrength = validatePasswordStrength(formData.password);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg md:text-xl font-semibold text-stone-100">
            Create Account
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
              <User className="w-4 h-4 inline mr-1" />
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm md:text-base placeholder-stone-500 ${
                validationErrors.name ? 'border-red-600' : 'border-stone-700'
              }`}
              style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
              placeholder="Enter your full name..."
              disabled={isLoading}
            />
            {validationErrors.name && (
              <p className="mt-1 text-xs text-red-400">{validationErrors.name}</p>
            )}
          </div>

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
                placeholder="Create a password..."
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
            {formData.password && (
              <div className="mt-2 p-2 bg-stone-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-stone-400">Password strength:</span>
                  <span className={`text-xs font-medium ${getPasswordStrengthColor(passwordStrength.score)}`}>
                    {getPasswordStrengthText(passwordStrength.score)}
                  </span>
                </div>
                <div className="w-full bg-stone-700 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full transition-all duration-300 ${
                      passwordStrength.score <= 2 ? 'bg-red-500' :
                      passwordStrength.score <= 3 ? 'bg-yellow-500' :
                      passwordStrength.score <= 4 ? 'bg-blue-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {passwordStrength.feedback.map((feedback, index) => (
                      <div key={index} className="flex items-center text-xs text-stone-400">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {feedback}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {validationErrors.password && (
              <p className="mt-1 text-xs text-red-400">{validationErrors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-stone-300 mb-2">
              <Lock className="w-4 h-4 inline mr-1" />
              Confirm Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`w-full px-3 py-2 pr-10 border bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm md:text-base placeholder-stone-500 ${
                  validationErrors.confirmPassword ? 'border-red-600' : 'border-stone-700'
                }`}
                style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
                placeholder="Confirm your password..."
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <div className="mt-1 flex items-center text-xs text-green-400">
                <CheckCircle className="w-3 h-3 mr-1" />
                Passwords match
              </div>
            )}
            {validationErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-400">{validationErrors.confirmPassword}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
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
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-amber-500 hover:text-amber-400 font-medium transition-colors"
                disabled={isLoading}
              >
                Sign in
              </button>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}
