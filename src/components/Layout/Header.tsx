import React, { useState } from 'react';
import { Search, Bell, User, Menu, LogOut, LogIn, Play, Shield, Lock } from 'lucide-react';
import { useApp } from '../../context/useApp';
import { AuthModal } from '../Auth/AuthModal';
import { Button } from '../UI/Button';
import { authenticateUser, registerUser } from '../../utils/auth';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { state, dispatch } = useApp();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState<string | undefined>();
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const { isAuthenticated, isDemoMode } = state.authentication;

  const handleLogin = async (email: string, password: string) => {
    setAuthError(undefined);
    setIsAuthLoading(true);
    
    try {
      const user = await authenticateUser(email, password);
      dispatch({ type: 'LOGIN', payload: user });
      setIsAuthModalOpen(false);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    setAuthError(undefined);
    setIsAuthLoading(true);
    
    try {
      const user = await registerUser(email, password, name);
      dispatch({ type: 'LOGIN', payload: user });
      setIsAuthModalOpen(false);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    if (isDemoMode) {
      handleSwitchToAuth();
    } else {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const handleSwitchToDemo = () => {
    dispatch({ type: 'SWITCH_TO_DEMO' });
  };

  const handleSwitchToAuth = () => {
    dispatch({ type: 'SWITCH_TO_AUTH' });
    // Add a small delay to ensure session is cleared before refresh
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const openLoginModal = () => {
    setAuthMode('login');
    setAuthError(undefined);
    setIsAuthModalOpen(true);
  };

  return (
    <>
      <header className="h-16 bg-stone-900 border-b border-stone-800 flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <button 
            className="lg:hidden p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors duration-250"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </button>
          
          {/* Search Bar - Only show for authenticated or demo users */}
          {(isAuthenticated || isDemoMode) && (
            <div className="flex items-center flex-1 max-w-lg">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-500" />
                <input
                  type="text"
                  placeholder="Search tasks, projects, or goals..."
                  value={state.searchQuery}
                  onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-stone-800 border border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-250 text-sm md:text-base text-stone-200 placeholder-stone-500"
                  style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
                />
              </div>
            </div>
          )}

          {/* Authentication Prompt for Unauthenticated Users */}
          {!isAuthenticated && !isDemoMode && (
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-stone-800/50 border border-stone-700 rounded-lg">
              <Lock className="h-4 w-4 text-stone-400" />
              <span className="text-sm text-stone-400">Login to access all features</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {/* Demo Mode Indicator */}
          {isDemoMode && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-lg">
              <Play className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-medium text-amber-300">Demo Mode</span>
            </div>
          )}

          {/* Authentication Status */}
          {isAuthenticated && !isDemoMode && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-lg">
              <Shield className="h-4 w-4 text-green-400" />
              <span className="text-xs font-medium text-green-300">Authenticated</span>
            </div>
          )}

          {/* User Profile Section */}
          <div className="flex items-center space-x-2">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* User Avatar/Name */}
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-lg">
                  <User className="h-4 w-4 text-stone-400" />
                  <span className="text-sm text-stone-200 font-medium">
                    {state.authentication.user?.name || 'User'}
                  </span>
                </div>
                
                {/* Logout Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-stone-400 hover:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {/* Demo Mode Toggle */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSwitchToDemo}
                  className="text-xs"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Try Demo
                </Button>
                
                {/* Login Button */}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={openLoginModal}
                  className="text-xs"
                >
                  <LogIn className="h-3 w-3 mr-1" />
                  Login
                </Button>
              </div>
            )}
          </div>

          {/* Notifications - Only show for authenticated or demo users */}
          {(isAuthenticated || isDemoMode) && (
            <button className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors duration-250">
              <Bell className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        defaultMode={authMode}
        isLoading={isAuthLoading}
        error={authError}
        onClearError={() => setAuthError(undefined)}
      />
    </>
  );
}