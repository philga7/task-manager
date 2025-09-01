import React, { useState, useEffect } from 'react';
import { GitHubIssue, GitHubIssueFormData, GitHubUser, GitHubLabel, GitHubMilestone } from '../../types';
import { X, Save, GitBranch, User, Tag, Calendar, AlertCircle } from 'lucide-react';

interface IssueFormProps {
  issue?: GitHubIssue;
  assignees: GitHubUser[];
  labels: GitHubLabel[];
  milestones: GitHubMilestone[];
  onSubmit: (data: GitHubIssueFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function IssueForm({ 
  issue, 
  assignees, 
  labels, 
  milestones, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: IssueFormProps) {
  const [formData, setFormData] = useState<GitHubIssueFormData>({
    title: issue?.title || '',
    body: issue?.body || '',
    assignees: issue?.assignees.map(a => a.login) || [],
    milestone: issue?.milestone?.id,
    labels: issue?.labels.map(l => l.name) || [],
    state: issue?.state || 'open'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.title.length > 256) {
      newErrors.title = 'Title must be less than 256 characters';
    }

    if (!formData.body.trim()) {
      newErrors.body = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof GitHubIssueFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle assignee selection
  const handleAssigneeChange = (assignee: string, checked: boolean) => {
    const newAssignees = checked
      ? [...formData.assignees, assignee]
      : formData.assignees.filter(a => a !== assignee);
    
    handleInputChange('assignees', newAssignees);
  };

  // Handle label selection
  const handleLabelChange = (label: string, checked: boolean) => {
    const newLabels = checked
      ? [...formData.labels, label]
      : formData.labels.filter(l => l !== label);
    
    handleInputChange('labels', newLabels);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-stone-900 rounded-lg border border-stone-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-700">
          <div className="flex items-center space-x-2">
            <GitBranch className="w-5 h-5 text-stone-400" />
            <h2 className="text-lg font-semibold text-stone-100">
              {issue ? 'Edit Issue' : 'Create New Issue'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-stone-400 hover:text-stone-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 bg-stone-800 border rounded-lg text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-500 ${
                errors.title ? 'border-red-500' : 'border-stone-600'
              }`}
              placeholder="Issue title..."
              maxLength={256}
            />
            {errors.title && (
              <div className="flex items-center space-x-1 mt-1 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.title}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-2">
              Description *
            </label>
            <textarea
              value={formData.body}
              onChange={(e) => handleInputChange('body', e.target.value)}
              rows={8}
              className={`w-full px-3 py-2 bg-stone-800 border rounded-lg text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-500 resize-vertical ${
                errors.body ? 'border-red-500' : 'border-stone-600'
              }`}
              placeholder="Describe the issue..."
            />
            {errors.body && (
              <div className="flex items-center space-x-1 mt-1 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.body}</span>
              </div>
            )}
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 text-stone-400 hover:text-stone-300 transition-colors"
          >
            <span>Advanced Options</span>
            <span className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t border-stone-700">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-600 rounded-lg text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-500"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Assignees */}
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">
                  Assignees
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {assignees.map(assignee => (
                    <label key={assignee.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.assignees.includes(assignee.login)}
                        onChange={(e) => handleAssigneeChange(assignee.login, e.target.checked)}
                        className="rounded border-stone-600 bg-stone-800 text-stone-500 focus:ring-stone-500"
                      />
                      <div className="flex items-center space-x-2">
                        <img
                          src={assignee.avatar_url}
                          alt={assignee.login}
                          className="w-5 h-5 rounded-full"
                        />
                        <span className="text-sm text-stone-300">{assignee.login}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Labels */}
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">
                  Labels
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {labels.map(label => (
                    <label key={label.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.labels.includes(label.name)}
                        onChange={(e) => handleLabelChange(label.name, e.target.checked)}
                        className="rounded border-stone-600 bg-stone-800 text-stone-500 focus:ring-stone-500"
                      />
                      <span
                        className="px-2 py-1 text-xs rounded-full"
                        style={{
                          backgroundColor: `#${label.color}`,
                          color: parseInt(label.color, 16) > 0x888888 ? '#000' : '#fff'
                        }}
                      >
                        {label.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Milestone */}
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">
                  Milestone
                </label>
                <select
                  value={formData.milestone || ''}
                  onChange={(e) => handleInputChange('milestone', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-600 rounded-lg text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-500"
                >
                  <option value="">No milestone</option>
                  {milestones
                    .filter(m => m.state === 'open')
                    .map(milestone => (
                      <option key={milestone.id} value={milestone.id}>
                        {milestone.title}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-stone-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-stone-300 hover:text-stone-100 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-stone-600 hover:bg-stone-500 text-stone-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-stone-100"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{issue ? 'Update Issue' : 'Create Issue'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
