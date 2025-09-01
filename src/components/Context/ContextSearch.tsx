import React, { useState, useMemo } from 'react';
import { ContextNode, ContextSearchFilter } from '../../types';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';

interface ContextSearchProps {
  nodes: ContextNode[];
  filters: ContextSearchFilter;
  onFiltersChange: (filters: ContextSearchFilter) => void;
  onSearch: (searchTerm: string) => void;
  className?: string;
}

export function ContextSearch({ 
  nodes, 
  filters, 
  onFiltersChange, 
  onSearch, 
  className = '' 
}: ContextSearchProps) {
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm || '');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Extract unique values for filter options
  const uniqueTypes = useMemo(() => 
    Array.from(new Set(nodes.map(node => node.type))), [nodes]
  );
  
  const uniqueStatuses = useMemo(() => 
    Array.from(new Set(nodes.map(node => node.metadata.status))), [nodes]
  );
  
  const uniquePriorities = useMemo(() => 
    Array.from(new Set(nodes.map(node => node.metadata.priority))), [nodes]
  );
  
  const uniqueTags = useMemo(() => {
    const allTags = nodes.flatMap(node => node.metadata.tags);
    return Array.from(new Set(allTags)).sort();
  }, [nodes]);
  
  const uniqueCreators = useMemo(() => 
    Array.from(new Set(nodes.map(node => node.metadata.createdBy))), [nodes]
  );

  const handleSearch = () => {
    onSearch(searchTerm);
    onFiltersChange({ ...filters, searchTerm });
  };

  const handleFilterChange = (key: keyof ContextSearchFilter, value: string | string[] | undefined) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    const clearedFilters: ContextSearchFilter = {};
    onFiltersChange(clearedFilters);
    setSearchTerm('');
  };

  const getFilteredCount = () => {
    return nodes.filter(node => {
      if (filters.type && node.type !== filters.type) return false;
      if (filters.status && node.metadata.status !== filters.status) return false;
      if (filters.priority && node.metadata.priority !== filters.priority) return false;
      if (filters.createdBy && node.metadata.createdBy !== filters.createdBy) return false;
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => node.metadata.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          node.name.toLowerCase().includes(searchLower) ||
          node.description.toLowerCase().includes(searchLower) ||
          node.content.toLowerCase().includes(searchLower) ||
          node.metadata.tags.some(tag => tag.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }
      return true;
    }).length;
  };

  return (
    <Card className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Context Search & Filters
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search context nodes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <Button onClick={handleSearch} size="sm">
          Search
        </Button>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {getFilteredCount()} of {nodes.length} context nodes
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Types</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Statuses</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={filters.priority || ''}
                onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Priorities</option>
                {uniquePriorities.map(priority => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Creator Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Created By
              </label>
              <select
                value={filters.createdBy || ''}
                onChange={(e) => handleFilterChange('createdBy', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Creators</option>
                {uniqueCreators.map(creator => (
                  <option key={creator} value={creator}>
                    {creator}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {uniqueTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    const currentTags = filters.tags || [];
                    const newTags = currentTags.includes(tag)
                      ? currentTags.filter(t => t !== tag)
                      : [...currentTags, tag];
                    handleFilterChange('tags', newTags);
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    (filters.tags || []).includes(tag)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
            >
              Clear All Filters
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
