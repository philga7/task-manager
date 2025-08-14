import React from 'react';
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ErrorBoundary } from './components/UI/ErrorBoundary';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Dashboard } from './pages/Dashboard';
import { Tasks } from './pages/Tasks';
import { Projects } from './pages/Projects';
import { Goals } from './pages/Goals';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';

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
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/goals" element={<Goals />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </main>
            </div>
          </div>
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;