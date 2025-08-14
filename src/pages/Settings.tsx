import React from 'react';
import { useState } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { useApp } from '../context/AppContext';
import { Settings as SettingsIcon, User, Bell, Palette, Shield, Download } from 'lucide-react';

export function Settings() {
  const { state } = useApp();
  const [profile, setProfile] = useState({
    name: 'Alex Morgan',
    email: 'alex@company.com'
  });
  const [notifications, setNotifications] = useState({
    emailTasks: true,
    dailySummary: true,
    weeklyReports: false
  });
  const [theme, setTheme] = useState('light');
  const [accentColor, setAccentColor] = useState('#D97757');

  const handleProfileSave = () => {
    // In a real app, this would save to backend
    alert('Profile updated successfully!');
  };

  const handleExportData = () => {
    const data = {
      tasks: state.tasks,
      projects: state.projects,
      goals: state.goals,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-manager-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-stone-100 mb-2">Settings</h1>
        <p className="text-stone-400">Manage your preferences and account</p>
      </div>

      <div className="space-y-4 md:space-y-6">
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
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm md:text-base"
                style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-stone-300 mb-1">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm md:text-base"
                style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
              />
            </div>
            <Button size="sm" onClick={handleProfileSave}>Save Changes</Button>
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
                checked={notifications.emailTasks}
                onChange={(e) => setNotifications({ ...notifications, emailTasks: e.target.checked })}
                className="rounded border-stone-600 bg-stone-800 focus:ring-2"
                style={{ accentColor: '#D97757', '--tw-ring-color': '#D97757' } as React.CSSProperties}
              />
              <span className="text-xs md:text-sm text-stone-300">Email notifications for due tasks</span>
            </label>
            <label className="flex items-center space-x-3">
              <input 
                type="checkbox" 
                checked={notifications.dailySummary}
                onChange={(e) => setNotifications({ ...notifications, dailySummary: e.target.checked })}
                className="rounded border-stone-600 bg-stone-800 focus:ring-2"
                style={{ accentColor: '#D97757', '--tw-ring-color': '#D97757' } as React.CSSProperties}
              />
              <span className="text-xs md:text-sm text-stone-300">Daily productivity summary</span>
            </label>
            <label className="flex items-center space-x-3">
              <input 
                type="checkbox" 
                checked={notifications.weeklyReports}
                onChange={(e) => setNotifications({ ...notifications, weeklyReports: e.target.checked })}
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
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-3 py-2 border border-stone-700 bg-stone-800 text-stone-200 rounded-lg focus:outline-none focus:ring-2 text-sm md:text-base"
                style={{ '--tw-ring-color': '#D97757' } as React.CSSProperties}
              >
                <option>Light</option>
                <option>Dark</option>
                <option>System</option>
              </select>
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-stone-300 mb-2">Accent Color</label>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setAccentColor('#D97757')}
                  className="w-6 h-6 md:w-8 md:h-8 rounded-lg border-2"
                  style={{ 
                    backgroundColor: '#D97757', 
                    borderColor: accentColor === '#D97757' ? '#C86A4A' : 'transparent' 
                  }}
                ></button>
                <button 
                  onClick={() => setAccentColor('#3B82F6')}
                  className="w-6 h-6 md:w-8 md:h-8 bg-blue-500 rounded-lg border-2 hover:border-stone-500"
                  style={{ borderColor: accentColor === '#3B82F6' ? '#2563EB' : 'transparent' }}
                ></button>
                <button 
                  onClick={() => setAccentColor('#10B981')}
                  className="w-6 h-6 md:w-8 md:h-8 bg-green-500 rounded-lg border-2 hover:border-stone-500"
                  style={{ borderColor: accentColor === '#10B981' ? '#059669' : 'transparent' }}
                ></button>
                <button 
                  onClick={() => setAccentColor('#8B5CF6')}
                  className="w-6 h-6 md:w-8 md:h-8 bg-purple-500 rounded-lg border-2 hover:border-stone-500"
                  style={{ borderColor: accentColor === '#8B5CF6' ? '#7C3AED' : 'transparent' }}
                ></button>
              </div>
            </div>
          </div>
        </Card>

        {/* Data & Privacy */}
        <Card>
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-5 h-5 text-stone-600" />
            <h3 className="text-base md:text-lg font-medium text-stone-100">Data & Privacy</h3>
          </div>
          <div className="space-y-3">
            <Button variant="secondary" size="sm" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <p className="text-xs md:text-sm text-stone-400">
              Download all your tasks, projects, and goals in JSON format.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}