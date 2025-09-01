import React, { useState, useMemo } from 'react';
import { GitHubIssue, GitHubSyncState } from '../../types';
import { Search, Filter, GitBranch, MessageSquare, Calendar, User, Tag } from 'lucide-react';
import { format } from 'date-fns';

interface IssueListProps {
  issues: GitHubIssue[];
  isLoading: boolean;
  filters: GitHubSyncState['filters'];
  onFilterChange: (filters: Partial<GitHubSyncState['filters']>) => void;
  onIssueClick: (issue: GitHubIssue) => void;
  onLinkTask: (issue: GitHubIssue) => void;
}

export function IssueList({ 
  issues, 
  isLoading, 
  filters, 
  onFilterChange, 
  onIssueClick, 
  onLinkTask 
}: IssueListProps) {
  const [showFilters, setShowFilters] = useState(false);

  // Filter and search issues
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      // State filter
      if (filters.state !== 'all' && issue.state !== filters.state) {
        return false;
      }

      // Assignee filter
      if (filters.assignee && !issue.assignees.some(assignee => assignee.login === filters.assignee)) {
        return false;
      }

      // Labels filter
      if (filters.labels.length > 0 && !filters.labels.every(label => 
        issue.labels.some(issueLabel => issueLabel.name === label)
      )) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          issue.title.toLowerCase().includes(searchLower) ||
          issue.body.toLowerCase().includes(searchLower) ||
          issue.labels.some(label => label.name.toLowerCase().includes(searchLower))
        );
      }

      return true;
    });
  }, [issues, filters]);

  // Get unique assignees and labels for filter options
  const assignees = useMemo(() => {
    const uniqueAssignees = new Set<string>();
    issues.forEach(issue => {
      issue.assignees.forEach(assignee => uniqueAssignees.add(assignee.login));
    });
    return Array.from(uniqueAssignees);
  }, [issues]);

  const labels = useMemo(() => {
    const uniqueLabels = new Set<string>();
    issues.forEach(issue => {
      issue.labels.forEach(label => uniqueLabels.add(label.name));
    });
    return Array.from(uniqueLabels);
  }, [issues]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="bg-stone-800 rounded-lg p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search issues..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-stone-700 border border-stone-600 rounded-lg text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 text-stone-300 hover:text-stone-100 transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>

        {/* Filter Options */}
        {showFilters && (
          <div className="space-y-3 pt-2 border-t border-stone-700">
            {/* State Filter */}
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-2">Status</label>
              <select
                value={filters.state}
                onChange={(e) => onFilterChange({ state: e.target.value as any })}
                className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded-lg text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-500"
              >
                <option value="all">All Issues</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Assignee Filter */}
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-2">Assignee</label>
              <select
                value={filters.assignee || ''}
                onChange={(e) => onFilterChange({ assignee: e.target.value || null })}
                className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded-lg text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-500"
              >
                <option value="">All Assignees</option>
                {assignees.map(assignee => (
                  <option key={assignee} value={assignee}>{assignee}</option>
                ))}
              </select>
            </div>

            {/* Labels Filter */}
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-2">Labels</label>
              <div className="flex flex-wrap gap-2">
                {labels.map(label => (
                  <button
                    key={label}
                    onClick={() => {
                      const newLabels = filters.labels.includes(label)
                        ? filters.labels.filter(l => l !== label)
                        : [...filters.labels, label];
                      onFilterChange({ labels: newLabels });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border ${
                      filters.labels.includes(label)
                        ? 'bg-stone-600 border-stone-500 text-stone-100'
                        : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {filteredIssues.length === 0 ? (
          <div className="text-center py-8 text-stone-400">
            <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No issues found matching your filters</p>
          </div>
        ) : (
          filteredIssues.map(issue => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onClick={() => onIssueClick(issue)}
              onLinkTask={() => onLinkTask(issue)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface IssueCardProps {
  issue: GitHubIssue;
  onClick: () => void;
  onLinkTask: () => void;
}

function IssueCard({ issue, onClick, onLinkTask }: IssueCardProps) {
  const isLinked = !!issue.linkedTaskId;
  const isOpen = issue.state === 'open';

  return (
    <div 
      className={`bg-stone-800 rounded-lg border p-4 cursor-pointer transition-all duration-200 hover:bg-stone-750 hover:border-stone-600 ${
        isLinked ? 'border-green-500/50' : 'border-stone-700'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        {/* Status Indicator */}
        <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
          isOpen ? 'bg-green-500' : 'bg-stone-500'
        }`} />

        <div className="flex-1 min-w-0">
          {/* Title and Link Status */}
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-medium text-stone-100 hover:text-stone-50 transition-colors">
              #{issue.number} {issue.title}
            </h3>
            {isLinked && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLinkTask();
                }}
                className="text-green-400 hover:text-green-300 text-xs"
              >
                Linked
              </button>
            )}
          </div>

          {/* Labels */}
          {issue.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {issue.labels.map(label => (
                <span
                  key={label.id}
                  className="px-2 py-1 text-xs rounded-full"
                  style={{
                    backgroundColor: `#${label.color}`,
                    color: parseInt(label.color, 16) > 0x888888 ? '#000' : '#fff'
                  }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}

          {/* Meta Information */}
          <div className="flex items-center space-x-4 mt-3 text-xs text-stone-400">
            <div className="flex items-center space-x-1">
              <User className="w-3 h-3" />
              <span>{issue.user.login}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(issue.created_at), 'MMM d, yyyy')}</span>
            </div>

            {issue.comments > 0 && (
              <div className="flex items-center space-x-1">
                <MessageSquare className="w-3 h-3" />
                <span>{issue.comments}</span>
              </div>
            )}

            {issue.assignees.length > 0 && (
              <div className="flex items-center space-x-1">
                <Tag className="w-3 h-3" />
                <span>{issue.assignees.map(a => a.login).join(', ')}</span>
              </div>
            )}
          </div>

          {/* Sync Status */}
          {issue.localStatus && (
            <div className="mt-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                issue.localStatus === 'synced' 
                  ? 'bg-green-900/50 text-green-300'
                  : issue.localStatus === 'pending'
                  ? 'bg-yellow-900/50 text-yellow-300'
                  : 'bg-red-900/50 text-red-300'
              }`}>
                {issue.localStatus === 'synced' && '✓ Synced'}
                {issue.localStatus === 'pending' && '⏳ Pending'}
                {issue.localStatus === 'error' && '✗ Error'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
