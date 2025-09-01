import React from 'react';
import { GitHubSyncPanel } from '../components/GitHub';

export function GitHubPage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-100">GitHub Integration</h1>
          <p className="text-stone-400">Manage GitHub issues and sync with local tasks</p>
        </div>
        
        <div className="h-[calc(100vh-200px)]">
          <GitHubSyncPanel />
        </div>
      </div>
    </div>
  );
}
