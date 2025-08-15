import React, { useState } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { useApp } from '../context/useApp';
import { User, Bell, Palette, Shield, LogOut, LogIn, Play, AlertTriangle, Save, Upload, Database } from 'lucide-react';
import { AuthModal } from '../components/Auth/AuthModal';
import { DataRecovery } from '../utils/storage';

export function Settings() {
  const { state, dispatch } = useApp();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const handleLogin = (email: string) => {
    // For demo purposes, create a mock user
    const mockUser = {
      id: `user-${Date.now()}`,
      name: email.split('@')[0],
      email: email,
      createdAt: new Date()
    };
    dispatch({ type: 'LOGIN', payload: mockUser });
    setIsAuthModalOpen(false);
  };

  const handleRegister = (name: string, email: string) => {
    // For demo purposes, create a mock user
    const mockUser = {
      id: `user-${Date.now()}`,
      name: name,
      email: email,
      createdAt: new Date()
    };
    dispatch({ type: 'LOGIN', payload: mockUser });
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const handleSwitchToDemo = () => {
    dispatch({ type: 'SWITCH_TO_DEMO' });
  };

  const handleSwitchToAuth = () => {
    dispatch({ type: 'SWITCH_TO_AUTH' });
  };

  // Data backup and restore functions
  const handleExportData = () => {
    const userId = state.authentication.user?.id || 'demo';
    const backupData = DataRecovery.exportUserData(userId);
    
    // Create and download backup file
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-manager-backup-${userId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const backupData = e.target?.result as string;
      const success = await DataRecovery.importUserData(backupData);
      
      if (success) {
        alert('Data imported successfully! Please refresh the page to see your restored data.');
        window.location.reload();
      } else {
        alert('Failed to import data. Please check the backup file format.');
      }
    };
    reader.readAsText(file);
  };

  const storageStats = DataRecovery.getStorageStats();

  const openLoginModal = () => {
    setAuthMode('login');
    setIsAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthMode('register');
    setIsAuthModalOpen(true);
  };

  return (
    <>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-stone-100 mb-2">Settings</h1>
          <p className="text-stone-400">Manage your preferences and account</p>
        </div>

        <div className="space-y-4 md:space-y-6">
          {/* Authentication Status */}
          <Card>
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-5 h-5 text-stone-600" />
              <h3 className="text-base md:text-lg font-medium text-stone-100">Authentication</h3>
            </div>
            
            <div className="space-y-4">
              {/* Current Status */}
              <div className="flex items-center justify-between p-3 bg-stone-800/50 rounded-lg border border-stone-700">
                <div className="flex items-center space-x-3">
                  {state.authentication.isDemoMode ? (
                    <>
                      <div className="flex items-center space-x-2 px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded">
                        <Play className="h-3 w-3 text-amber-400" />
                        <span className="text-xs font-medium text-amber-300">Demo Mode</span>
                      </div>
                      <span className="text-sm text-stone-300">Using demo data</span>
                    </>
                  ) : state.authentication.isAuthenticated ? (
                    <>
                      <div className="flex items-center space-x-2 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded">
                        <User className="h-3 w-3 text-green-400" />
                        <span className="text-xs font-medium text-green-300">Authenticated</span>
                      </div>
                      <span className="text-sm text-stone-300">
                        Logged in as {state.authentication.user?.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2 px-2 py-1 bg-stone-500/20 border border-stone-500/30 rounded">
                        <AlertTriangle className="h-3 w-3 text-stone-400" />
                        <span className="text-xs font-medium text-stone-300">Not Authenticated</span>
                      </div>
                      <span className="text-sm text-stone-300">No user account</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {!state.authentication.isAuthenticated && !state.authentication.isDemoMode && (
                  <>
                    <Button variant="primary" size="sm" onClick={openLoginModal}>
                      <LogIn className="w-4 h-4 mr-2" />
                      Login
                    </Button>
                    <Button variant="secondary" size="sm" onClick={openRegisterModal}>
                      Register
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleSwitchToDemo}>
                      <Play className="w-4 h-4 mr-2" />
                      Try Demo Mode
                    </Button>
                  </>
                )}

                {state.authentication.isDemoMode && (
                  <Button variant="secondary" size="sm" onClick={handleSwitchToAuth}>
                    Exit Demo Mode
                  </Button>
                )}

                {state.authentication.isAuthenticated && !state.authentication.isDemoMode && (
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-400 hover:text-red-300">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                )}
              </div>

              {/* Demo Mode Warning */}
              {state.authentication.isDemoMode && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-300 mb-1">Demo Mode Active</p>
                      <p className="text-xs text-amber-200">
                        You're currently using demo data. Your changes will not be saved permanently. 
                        Create an account to save your data.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Profile Settings */}
          <Card>
            <div className="flex items-center space-x-3 mb-4">
              <User className="w-5 h-5 text-stone-600" />
              <h3 className="text-base md:text-lg font-medium text-stone-100">Profile</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-stone-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={state.userSettings.profile.name}
                  onChange={(e) => dispatch({
                    type: 'UPDATE_USER_PROFILE',
                    payload: { ...state.userSettings.profile, name: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm md:text-base"
                  style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-stone-300 mb-1">Email</label>
                <input
                  type="email"
                  value={state.userSettings.profile.email}
                  onChange={(e) => dispatch({
                    type: 'UPDATE_USER_PROFILE',
                    payload: { ...state.userSettings.profile, email: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm md:text-base"
                  style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
                />
              </div>
            </div>
          </Card>

          {/* Notifications */}
          <Card>
            <div className="flex items-center space-x-3 mb-4">
              <Bell className="w-5 h-5 text-stone-600" />
              <h3 className="text-base md:text-lg font-medium text-stone-100">Notifications</h3>
            </div>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  checked={state.userSettings.notifications.emailTasks}
                  onChange={(e) => dispatch({
                    type: 'UPDATE_NOTIFICATION_SETTINGS',
                    payload: { ...state.userSettings.notifications, emailTasks: e.target.checked }
                  })}
                  className="rounded border-stone-600 bg-stone-800 focus:ring-2"
                  style={{ accentColor: '#D97757', '--tw-ring-color': '#D97757' } as React.CSSProperties}
                />
                <span className="text-xs md:text-sm text-stone-300">Email notifications for due tasks</span>
              </label>
              <label className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  checked={state.userSettings.notifications.dailySummary}
                  onChange={(e) => dispatch({
                    type: 'UPDATE_NOTIFICATION_SETTINGS',
                    payload: { ...state.userSettings.notifications, dailySummary: e.target.checked }
                  })}
                  className="rounded border-stone-600 bg-stone-800 focus:ring-2"
                  style={{ accentColor: '#D97757', '--tw-ring-color': '#D97757' } as React.CSSProperties}
                />
                <span className="text-xs md:text-sm text-stone-300">Daily productivity summary</span>
              </label>
              <label className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  checked={state.userSettings.notifications.weeklyReports}
                  onChange={(e) => dispatch({
                    type: 'UPDATE_NOTIFICATION_SETTINGS',
                    payload: { ...state.userSettings.notifications, weeklyReports: e.target.checked }
                  })}
                  className="rounded border-stone-600 bg-stone-800 focus:ring-2"
                  style={{ accentColor: '#D97757', '--tw-ring-color': '#D97757' } as React.CSSProperties}
                />
                <span className="text-xs md:text-sm text-stone-300">Weekly progress reports</span>
              </label>
            </div>
          </Card>

          {/* Appearance */}
          <Card>
            <div className="flex items-center space-x-3 mb-4">
              <Palette className="w-5 h-5 text-stone-600" />
              <h3 className="text-base md:text-lg font-medium text-stone-100">Appearance</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs md:text-sm font-medium text-stone-300 mb-2">Theme</label>
                <select 
                  value={state.userSettings.appearance.theme}
                  onChange={(e) => dispatch({
                    type: 'UPDATE_APPEARANCE_SETTINGS',
                    payload: { ...state.userSettings.appearance, theme: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 text-sm md:text-base"
                  style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-stone-300 mb-2">Accent Color</label>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => dispatch({
                      type: 'UPDATE_APPEARANCE_SETTINGS',
                      payload: { ...state.userSettings.appearance, accentColor: '#D97757' }
                    })}
                    className="w-6 h-6 md:w-8 md:h-8 rounded-lg border-2"
                    style={{ 
                      backgroundColor: '#D97757', 
                      borderColor: state.userSettings.appearance.accentColor === '#D97757' ? '#C86A4A' : 'transparent' 
                    }}
                  ></button>
                  <button 
                    onClick={() => dispatch({
                      type: 'UPDATE_APPEARANCE_SETTINGS',
                      payload: { ...state.userSettings.appearance, accentColor: '#3B82F6' }
                    })}
                    className="w-6 h-6 md:w-8 md:h-8 bg-blue-500 rounded-lg border-2 hover:border-stone-500"
                    style={{ borderColor: state.userSettings.appearance.accentColor === '#3B82F6' ? '#2563EB' : 'transparent' }}
                  ></button>
                  <button 
                    onClick={() => dispatch({
                      type: 'UPDATE_APPEARANCE_SETTINGS',
                      payload: { ...state.userSettings.appearance, accentColor: '#10B981' }
                    })}
                    className="w-6 h-6 md:w-8 md:h-8 bg-green-500 rounded-lg border-2 hover:border-stone-500"
                    style={{ borderColor: state.userSettings.appearance.accentColor === '#10B981' ? '#059669' : 'transparent' }}
                  ></button>
                  <button 
                    onClick={() => dispatch({
                      type: 'UPDATE_APPEARANCE_SETTINGS',
                      payload: { ...state.userSettings.appearance, accentColor: '#8B5CF6' }
                    })}
                    className="w-6 h-6 md:w-8 md:h-8 bg-purple-500 rounded-lg border-2 hover:border-stone-500"
                    style={{ borderColor: state.userSettings.appearance.accentColor === '#8B5CF6' ? '#7C3AED' : 'transparent' }}
                  ></button>
                </div>
              </div>
            </div>
          </Card>

          {/* Data & Privacy */}
          <Card>
            <div className="flex items-center space-x-3 mb-4">
              <Database className="w-5 h-5 text-stone-600" />
              <h3 className="text-base md:text-lg font-medium text-stone-100">Data & Privacy</h3>
            </div>
            <div className="space-y-4">
              {/* Storage Statistics */}
              <div>
                <h4 className="text-sm font-medium text-stone-200 mb-2">Storage Usage</h4>
                <div className="text-xs text-stone-400 space-y-1">
                  <div>localStorage: {(storageStats.localStorage / 1024).toFixed(2)} KB</div>
                  <div>sessionStorage: {(storageStats.sessionStorage / 1024).toFixed(2)} KB</div>
                </div>
              </div>
              
              {/* Data Export */}
              <div>
                <h4 className="text-sm font-medium text-stone-200 mb-2">Data Export</h4>
                <p className="text-xs text-stone-400 mb-3">
                  Export your data for backup or transfer to another device. This includes all your tasks, projects, and goals.
                </p>
                <Button variant="secondary" size="sm" onClick={handleExportData}>
                  <Save className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
              </div>
              
              {/* Data Import */}
              <div>
                <h4 className="text-sm font-medium text-stone-200 mb-2">Data Import</h4>
                <p className="text-xs text-stone-400 mb-3">
                  Import previously exported data. This will replace your current data.
                </p>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                    id="import-file"
                  />
                  <label htmlFor="import-file">
                    <Button variant="secondary" size="sm" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Import Data
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
              
              {/* Clear Data */}
              <div>
                <h4 className="text-sm font-medium text-stone-200 mb-2">Clear All Data</h4>
                <p className="text-xs text-stone-400 mb-3">
                  Permanently delete all your data. This action cannot be undone.
                </p>
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                  Clear All Data
                </Button>
              </div>
              
              {/* Storage Protection Info */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Database className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-300 mb-1">Storage Protection</p>
                    <p className="text-xs text-blue-200">
                      Your data is stored in multiple locations (localStorage, sessionStorage, IndexedDB, and cookies) 
                      to prevent accidental loss. Regular backups are recommended.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        defaultMode={authMode}
      />
    </>
  );
}