import React, { useState, useEffect, useRef } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

type AuthMode = 'login' | 'register';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => void;
  onRegister: (name: string, email: string, password: string) => void;
  isLoading?: boolean;
  error?: string;
  defaultMode?: AuthMode;
}

export function AuthModal({ 
  isOpen, 
  onClose, 
  onLogin, 
  onRegister, 
  isLoading = false, 
  error,
  defaultMode = 'login'
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
    }
  }, [isOpen, defaultMode]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      if (firstElement) {
        firstElement.focus();
      }
    }
  }, [isOpen, mode]);

  // Handle click outside modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSwitchToRegister = () => {
    setMode('register');
  };

  const handleSwitchToLogin = () => {
    setMode('login');
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      {mode === 'login' ? (
        <LoginForm
          onClose={onClose}
          onSwitchToRegister={handleSwitchToRegister}
          onSubmit={onLogin}
          isLoading={isLoading}
          error={error}
        />
      ) : (
        <RegisterForm
          onClose={onClose}
          onSwitchToLogin={handleSwitchToLogin}
          onSubmit={onRegister}
          isLoading={isLoading}
          error={error}
        />
      )}
    </div>
  );
}
