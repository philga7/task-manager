import React, { useState, useEffect, useCallback } from 'react';
import { 
  GitHubIssue, 
  GitHubSyncState, 
  GitHubIssueFormData, 
  GitHubUser, 
  GitHubLabel, 
  GitHubMilestone,
  Task 
} from '../../types';
import { IssueList } from './IssueList';
import { IssueForm } from './IssueForm';
import { 
  GitBranch, 
  Plus, 
  RefreshCw, 
  Settings, 
  Link, 
  ExternalLink, 
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useApp } from '../../context/useApp';

interface GitHubSyncPanelProps {
  onClose?: () => void;
}

export function GitHubSyncPanel({ onClose }: GitHubSyncPanelProps) {
  const { state, dispatch } = useApp();
  
  // Local state for GitHub sync
  const [syncState, setSyncState] = useState<GitHubSyncState>({
    issues: [],
    isLoading: false,
    error: null,
    lastSyncAt: null,
    syncInProgress: false,
    filters: {
      state: 'all',
      assignee: null,
      labels: [],
      search: ''
    }
  });

  // Form state
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [editingIssue, setEditingIssue] = useState<GitHubIssue | undefined>();
  const [formLoading, setFormLoading] = useState(false);

  // GitHub metadata
  const [assignees, setAssignees] = useState<GitHubUser[]>([]);
  const [labels, setLabels] = useState<GitHubLabel[]>([]);
  const [milestones, setMilestones] = useState<GitHubMilestone[]>([]);

  // Mock data for demo mode (in real implementation, this would come from GitHub API)
  const mockIssues: GitHubIssue[] = [
    {
      id: 1,
      number: 1,
      title: 'Implement GitHub integration',
      body: 'Add GitHub issue synchronization to the task manager',
      state: 'open',
      locked: false,
      assignees: [],
      labels: [
        { id: 1, node_id: '1', url: '', name: 'enhancement', color: '84b6eb', default: false }
      ],
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      user: {
        login: 'philga7',
        id: 1,
        node_id: '1',
        avatar_url: 'https://github.com/github.png',
        gravatar_id: '',
        url: '',
        html_url: '',
        followers_url: '',
        following_url: '',
        gists_url: '',
        starred_url: '',
        subscriptions_url: '',
        organizations_url: '',
        repos_url: '',
        events_url: '',
        received_events_url: '',
        type: 'User',
        site_admin: false
      },
      html_url: 'https://github.com/philga7/task-manager/issues/1',
      comments_url: '',
      events_url: '',
      labels_url: '',
      repository_url: '',
      assignees_url: '',
      comments: 2,
      author_association: 'OWNER',
      timeline_url: '',
      linkedTaskId: 'task-1',
      localStatus: 'synced',
      lastSyncAt: new Date()
    },
    {
      id: 2,
      number: 2,
      title: 'Fix mobile responsiveness',
      body: 'Improve mobile layout and touch interactions',
      state: 'open',
      locked: false,
      assignees: [],
      labels: [
        { id: 2, node_id: '2', url: '', name: 'bug', color: 'd73a4a', default: false }
      ],
      created_at: '2024-01-14T15:30:00Z',
      updated_at: '2024-01-14T15:30:00Z',
      user: {
        login: 'philga7',
        id: 1,
        node_id: '1',
        avatar_url: 'https://github.com/github.png',
        gravatar_id: '',
        url: '',
        html_url: '',
        followers_url: '',
        following_url: '',
        gists_url: '',
        starred_url: '',
        subscriptions_url: '',
        organizations_url: '',
        repos_url: '',
        events_url: '',
        received_events_url: '',
        type: 'User',
        site_admin: false
      },
      html_url: 'https://github.com/philga7/task-manager/issues/2',
      comments_url: '',
      events_url: '',
      labels_url: '',
      repository_url: '',
      assignees_url: '',
      comments: 0,
      author_association: 'OWNER',
      timeline_url: '',
      localStatus: 'pending',
      lastSyncAt: new Date()
    }
  ];

  const mockAssignees: GitHubUser[] = [
    {
      login: 'philga7',
      id: 1,
      node_id: '1',
      avatar_url: 'https://github.com/github.png',
      gravatar_id: '',
      url: '',
      html_url: '',
      followers_url: '',
      following_url: '',
      gists_url: '',
      starred_url: '',
      subscriptions_url: '',
      organizations_url: '',
      repos_url: '',
      events_url: '',
      received_events_url: '',
      type: 'User',
      site_admin: false
    }
  ];

  const mockLabels: GitHubLabel[] = [
    { id: 1, node_id: '1', url: '', name: 'enhancement', color: '84b6eb', default: false },
    { id: 2, node_id: '2', url: '', name: 'bug', color: 'd73a4a', default: false },
    { id: 3, node_id: '3', url: '', name: 'documentation', color: '0075ca', default: false }
  ];

  const mockMilestones: GitHubMilestone[] = [
    {
      url: '',
      html_url: '',
      labels_url: '',
      id: 1,
      node_id: '1',
      number: 1,
      title: 'v1.2.0 Release',
      description: 'Major feature release',
      creator: mockAssignees[0],
      open_issues: 5,
      closed_issues: 10,
      state: 'open',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z'
    }
  ];

  // Load initial data
  useEffect(() => {
    loadGitHubData();
  }, []);

  // Mock function to load GitHub data
  const loadGitHubData = useCallback(async () => {
    setSyncState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSyncState(prev => ({
        ...prev,
        issues: mockIssues,
        isLoading: false,
        lastSyncAt: new Date()
      }));

      setAssignees(mockAssignees);
      setLabels(mockLabels);
      setMilestones(mockMilestones);
    } catch (error) {
      setSyncState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load GitHub issues'
      }));
    }
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<GitHubSyncState['filters']>) => {
    setSyncState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters }
    }));
  }, []);

  // Handle issue click
  const handleIssueClick = useCallback((issue: GitHubIssue) => {
    setEditingIssue(issue);
    setShowIssueForm(true);
  }, []);

  // Handle issue form submission
  const handleIssueSubmit = useCallback(async (formData: GitHubIssueFormData) => {
    setFormLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (editingIssue) {
        // Update existing issue
        const updatedIssues = syncState.issues.map(issue =>
          issue.id === editingIssue.id
            ? { ...issue, ...formData, updated_at: new Date().toISOString() }
            : issue
        );
        setSyncState(prev => ({ ...prev, issues: updatedIssues }));
      } else {
        // Create new issue
        const newIssue: GitHubIssue = {
          id: Date.now(),
          number: syncState.issues.length + 1,
          title: formData.title,
          body: formData.body,
          state: formData.state || 'open',
          locked: false,
          assignees: formData.assignees?.map(login => 
            assignees.find(a => a.login === login)
          ).filter(Boolean) as GitHubUser[],
          labels: formData.labels?.map(name => 
            labels.find(l => l.name === name)
          ).filter(Boolean) as GitHubLabel[],
          milestone: formData.milestone ? 
            milestones.find(m => m.id === formData.milestone) : undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user: mockAssignees[0],
          html_url: `https://github.com/philga7/task-manager/issues/${syncState.issues.length + 1}`,
          comments_url: '',
          events_url: '',
          labels_url: '',
          repository_url: '',
          assignees_url: '',
          comments: 0,
          author_association: 'OWNER',
          timeline_url: '',
          localStatus: 'synced',
          lastSyncAt: new Date()
        };

        setSyncState(prev => ({
          ...prev,
          issues: [newIssue, ...prev.issues]
        }));
      }

      setShowIssueForm(false);
      setEditingIssue(undefined);
    } catch (error) {
      console.error('Failed to save issue:', error);
    } finally {
      setFormLoading(false);
    }
  }, [editingIssue, syncState.issues, assignees, labels, milestones]);

  // Handle task linking
  const handleLinkTask = useCallback((issue: GitHubIssue) => {
    // In a real implementation, this would open a task selection modal
    // For now, we'll just toggle the linked state
    const updatedIssues = syncState.issues.map(i =>
      i.id === issue.id
        ? { 
            ...i, 
            linkedTaskId: i.linkedTaskId ? undefined : 'task-1',
            localStatus: i.linkedTaskId ? undefined : 'synced' as const,
            lastSyncAt: i.linkedTaskId ? undefined : new Date()
          }
        : i
    );
    setSyncState(prev => ({ ...prev, issues: updatedIssues }));
  }, [syncState.issues]);

  // Handle sync
  const handleSync = useCallback(async () => {
    setSyncState(prev => ({ ...prev, syncInProgress: true }));

    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update sync status for all issues
      const updatedIssues = syncState.issues.map(issue => ({
        ...issue,
        localStatus: 'synced' as const,
        lastSyncAt: new Date()
      }));

      setSyncState(prev => ({
        ...prev,
        issues: updatedIssues,
        syncInProgress: false,
        lastSyncAt: new Date()
      }));
    } catch (error) {
      setSyncState(prev => ({
        ...prev,
        syncInProgress: false,
        error: 'Sync failed'
      }));
    }
  }, [syncState.issues]);

  return (
    <div className="bg-stone-900 rounded-lg border border-stone-700 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-stone-700">
        <div className="flex items-center space-x-3">
          <GitBranch className="w-6 h-6 text-stone-400" />
          <div>
            <h2 className="text-lg font-semibold text-stone-100">GitHub Issues</h2>
            <p className="text-sm text-stone-400">Manage and sync GitHub issues</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Sync Status */}
          {syncState.lastSyncAt && (
            <div className="flex items-center space-x-1 text-xs text-stone-400">
              <Clock className="w-3 h-3" />
              <span>Last sync: {syncState.lastSyncAt.toLocaleTimeString()}</span>
            </div>
          )}

          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={syncState.syncInProgress}
            className="flex items-center space-x-2 px-3 py-2 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded-lg transition-colors disabled:opacity-50"
          >
            {syncState.syncInProgress ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>Sync</span>
          </button>

          {/* Create Issue Button */}
          <button
            onClick={() => {
              setEditingIssue(undefined);
              setShowIssueForm(true);
            }}
            className="flex items-center space-x-2 px-3 py-2 bg-stone-600 hover:bg-stone-500 text-stone-100 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Issue</span>
          </button>

          {/* Settings Button */}
          <button className="p-2 text-stone-400 hover:text-stone-300 transition-colors">
            <Settings className="w-4 h-4" />
          </button>

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-300 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {syncState.error && (
        <div className="mx-6 mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg">
          <div className="flex items-center space-x-2 text-red-300">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{syncState.error}</span>
          </div>
        </div>
      )}

      {/* Sync Status Summary */}
      <div className="mx-6 mt-4 p-3 bg-stone-800 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-stone-300">
              {syncState.issues.length} total issues
            </span>
            <span className="text-green-400">
              {syncState.issues.filter(i => i.localStatus === 'synced').length} synced
            </span>
            <span className="text-yellow-400">
              {syncState.issues.filter(i => i.localStatus === 'pending').length} pending
            </span>
            <span className="text-red-400">
              {syncState.issues.filter(i => i.localStatus === 'error').length} errors
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Link className="w-4 h-4 text-stone-400" />
            <span className="text-stone-400">
              {syncState.issues.filter(i => i.linkedTaskId).length} linked to tasks
            </span>
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto p-6">
        <IssueList
          issues={syncState.issues}
          isLoading={syncState.isLoading}
          filters={syncState.filters}
          onFilterChange={handleFilterChange}
          onIssueClick={handleIssueClick}
          onLinkTask={handleLinkTask}
        />
      </div>

      {/* Issue Form Modal */}
      {showIssueForm && (
        <IssueForm
          issue={editingIssue}
          assignees={assignees}
          labels={labels}
          milestones={milestones}
          onSubmit={handleIssueSubmit}
          onCancel={() => {
            setShowIssueForm(false);
            setEditingIssue(undefined);
          }}
          isLoading={formLoading}
        />
      )}
    </div>
  );
}
