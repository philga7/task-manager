import React, { useState, useEffect } from 'react';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { useCCPMSync, useDefaultCCPMSyncConfig } from '../../hooks/useCCPMSync';
import { CCPMSyncConfig } from '../../types';

interface CCPMSyncConfigProps {
  className?: string;
}

export function CCPMSyncConfigComponent({ className = '' }: CCPMSyncConfigProps) {
  const {
    ccpmSync,
    initializeSync,
    startSync,
    testConnection,
    disableSync,
    isEnabled,
    isConnected,
    syncInProgress,
    error
  } = useCCPMSync();

  const defaultConfig = useDefaultCCPMSyncConfig();
  
  const [config, setConfig] = useState<CCPMSyncConfig>(defaultConfig);
  const [isEditing, setIsEditing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Initialize config from current state
  useEffect(() => {
    if (ccpmSync.repository || ccpmSync.accessToken) {
      setConfig({
        ...defaultConfig,
        repository: ccpmSync.repository || '',
        accessToken: ccpmSync.accessToken || '',
        syncMode: ccpmSync.syncMode,
        autoSyncInterval: ccpmSync.autoSyncInterval,
        conflictResolution: ccpmSync.conflictResolution
      });
    }
  }, [ccpmSync, defaultConfig]);

  const handleConfigChange = (field: keyof CCPMSyncConfig, value: string | number | boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveConfig = async () => {
    try {
      await initializeSync(config);
      setIsEditing(false);
      setTestResult(null);
    } catch (error) {
      console.error('Failed to save CCPM config:', error);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTestResult({ success: true, message: 'Testing connection...' });
      const result = await testConnection();
      
      if (result.success) {
        setTestResult({ success: true, message: 'Connection successful!' });
      } else {
        setTestResult({ success: false, message: `Connection failed: ${result.error}` });
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `Connection test error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  const handleStartSync = async () => {
    try {
      await startSync();
    } catch (error) {
      console.error('Failed to start sync:', error);
    }
  };

  const handleDisableSync = () => {
    disableSync();
    setConfig(defaultConfig);
    setIsEditing(false);
    setTestResult(null);
  };

  if (!isEditing && !isEnabled) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="text-6xl mb-4">🔗</div>
          <h3 className="text-lg font-semibold text-stone-200 mb-2">CCPM Integration</h3>
          <p className="text-stone-400 mb-4">
            Connect your Shrimp Task Manager to CCPM for advanced workstream orchestration
          </p>
          <Button onClick={() => setIsEditing(true)} variant="primary">
            Configure CCPM Sync
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-stone-200">CCPM Sync Configuration</h3>
        <div className="flex items-center space-x-2">
          {isEnabled && (
            <Button 
              onClick={handleStartSync} 
              variant="primary" 
              disabled={syncInProgress}
              size="sm"
            >
              {syncInProgress ? 'Syncing...' : 'Start Sync'}
            </Button>
          )}
          <Button 
            onClick={() => setIsEditing(!isEditing)} 
            variant="secondary" 
            size="sm"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-sm text-stone-400">
            Status: {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        {error && (
          <div className="text-red-400 text-sm mt-1">{error}</div>
        )}
        {testResult && (
          <div className={`text-sm mt-1 ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
            {testResult.message}
          </div>
        )}
      </div>

      {/* Configuration Form */}
      {isEditing && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-2">
              Repository
            </label>
            <input
              type="text"
              value={config.repository}
              onChange={(e) => handleConfigChange('repository', e.target.value)}
              placeholder="owner/repository"
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-300 mb-2">
              Access Token
            </label>
            <input
              type="password"
              value={config.accessToken}
              onChange={(e) => handleConfigChange('accessToken', e.target.value)}
              placeholder="GitHub Personal Access Token"
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-300 mb-2">
              Base URL
            </label>
            <input
              type="text"
              value={config.baseUrl}
              onChange={(e) => handleConfigChange('baseUrl', e.target.value)}
              placeholder="http://localhost:8000"
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-300 mb-2">
              Sync Mode
            </label>
            <select
              value={config.syncMode}
              onChange={(e) => handleConfigChange('syncMode', e.target.value)}
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-500"
            >
              <option value="disabled">Disabled</option>
              <option value="manual">Manual</option>
              <option value="auto">Automatic</option>
            </select>
          </div>

          {config.syncMode === 'auto' && (
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-2">
                Auto-sync Interval (minutes)
              </label>
              <input
                type="number"
                value={config.autoSyncInterval}
                onChange={(e) => handleConfigChange('autoSyncInterval', parseInt(e.target.value))}
                min="1"
                max="1440"
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-stone-300 mb-2">
              Conflict Resolution
            </label>
            <select
              value={config.conflictResolution}
              onChange={(e) => handleConfigChange('conflictResolution', e.target.value)}
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-500"
            >
              <option value="manual">Manual Resolution</option>
              <option value="shrimp-wins">Shrimp Wins</option>
              <option value="ccpm-wins">CCPM Wins</option>
              <option value="merge">Merge</option>
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              id="enableWorkstreamSync"
              checked={config.enableWorkstreamSync}
              onChange={(e) => handleConfigChange('enableWorkstreamSync', e.target.checked)}
              className="w-4 h-4 text-stone-500 bg-stone-800 border-stone-700 rounded focus:ring-stone-500"
            />
            <label htmlFor="enableWorkstreamSync" className="text-sm text-stone-300">
              Enable Workstream Sync
            </label>
          </div>

          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              id="enableTaskSync"
              checked={config.enableTaskSync}
              onChange={(e) => handleConfigChange('enableTaskSync', e.target.checked)}
              className="w-4 h-4 text-stone-500 bg-stone-800 border-stone-700 rounded focus:ring-stone-500"
            />
            <label htmlFor="enableTaskSync" className="text-sm text-stone-300">
              Enable Task Sync
            </label>
          </div>

          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              id="enableRealTimeSync"
              checked={config.enableRealTimeSync}
              onChange={(e) => handleConfigChange('enableRealTimeSync', e.target.checked)}
              className="w-4 h-4 text-stone-500 bg-stone-800 border-stone-700 rounded focus:ring-stone-500"
            />
            <label htmlFor="enableRealTimeSync" className="text-sm text-stone-300">
              Enable Real-time Sync
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button onClick={handleTestConnection} variant="secondary" size="sm">
              Test Connection
            </Button>
            <Button onClick={handleSaveConfig} variant="primary" size="sm">
              Save Configuration
            </Button>
          </div>
        </div>
      )}

      {/* Current Configuration Display */}
      {!isEditing && isEnabled && (
        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-stone-400">Repository:</span>
              <span className="text-stone-200 ml-2">{config.repository}</span>
            </div>
            <div>
              <span className="text-stone-400">Sync Mode:</span>
              <span className="text-stone-200 ml-2 capitalize">{config.syncMode}</span>
            </div>
            <div>
              <span className="text-stone-400">Conflict Resolution:</span>
              <span className="text-stone-200 ml-2 capitalize">{config.conflictResolution.replace('-', ' ')}</span>
            </div>
            {config.syncMode === 'auto' && (
              <div>
                <span className="text-stone-400">Auto-sync Interval:</span>
                <span className="text-stone-200 ml-2">{config.autoSyncInterval} minutes</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sync History */}
      {isEnabled && ccpmSync.syncHistory.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-medium text-stone-200 mb-3">Recent Sync Events</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {ccpmSync.syncHistory.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center justify-between text-sm p-2 bg-stone-800 rounded">
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${
                    event.type === 'sync-completed' ? 'bg-green-400' :
                    event.type === 'sync-failed' ? 'bg-red-400' :
                    'bg-blue-400'
                  }`} />
                  <span className="text-stone-300">{event.details}</span>
                </div>
                <span className="text-stone-500 text-xs">
                  {event.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {isEnabled && !isEditing && (
        <div className="flex space-x-3 pt-4 border-t border-stone-700">
          <Button onClick={handleDisableSync} variant="secondary" size="sm">
            Disable CCPM Sync
          </Button>
          {ccpmSync.lastSyncAt && (
            <div className="text-sm text-stone-500 self-center">
              Last sync: {ccpmSync.lastSyncAt.toLocaleString()}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
