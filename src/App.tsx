import React from 'react';
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ErrorBoundary } from './components/UI/ErrorBoundary';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { MobileCompatibilityWarning } from './components/UI/MobileCompatibilityWarning';
import { Dashboard } from './pages/Dashboard';
import { Tasks } from './pages/Tasks';
import { Projects } from './pages/Projects';
import { Goals } from './pages/Goals';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { useApp } from './context/useApp';

// Settings wrapper component that redirects authenticated users to Dashboard
function SettingsWrapper() {
  const { state } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isDemoMode } = state.authentication;

  React.useEffect(() => {
    // If authenticated or in demo mode and on settings page, redirect to dashboard
    if ((isAuthenticated || isDemoMode) && location.pathname === '/settings') {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isDemoMode, location.pathname, navigate]);

  // Only render Settings if not authenticated and not in demo mode
  if (isAuthenticated || isDemoMode) {
    return null; // Will redirect via useEffect
  }

  return <Settings />;
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ErrorBoundary>
      <AppProvider>
        <Router>
          <div className="flex h-screen bg-stone-950">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header onMenuClick={() => setIsSidebarOpen(true)} />
              <main className="flex-1 overflow-auto">
                <Routes>
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/tasks" element={
                    <ProtectedRoute>
                      <Tasks />
                    </ProtectedRoute>
                  } />
                  <Route path="/projects" element={
                    <ProtectedRoute>
                      <Projects />
                    </ProtectedRoute>
                  } />
                  <Route path="/goals" element={
                    <ProtectedRoute>
                      <Goals />
                    </ProtectedRoute>
                  } />
                  <Route path="/analytics" element={
                    <ProtectedRoute>
                      <Analytics />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={<SettingsWrapper />} />
                </Routes>
              </main>
            </div>
            <MobileCompatibilityWarning />
          </div>
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;