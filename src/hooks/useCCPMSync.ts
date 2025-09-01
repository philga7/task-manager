import { useCallback, useEffect, useRef } from 'react';
import { useApp } from '../context/useApp';
import { CCPMSyncService, createDefaultCCPMSyncConfig } from '../services/ccpmSyncService';
import { 
  CCPMSyncConfig, 
  WorkstreamMapping,
  TaskMapping
} from '../types';

/**
 * Custom hook for CCPM synchronization
 * Provides methods to manage CCPM sync state and operations
 */
export function useCCPMSync() {
  const { state, dispatch } = useApp();
  const syncServiceRef = useRef<CCPMSyncService | null>(null);
  const { ccpmSync } = state;

  /**
   * Initialize CCPM sync service
   */
  const initializeSync = useCallback(async (config: CCPMSyncConfig) => {
    try {
      // Create and initialize sync service
      const service = new CCPMSyncService(config);
      const success = await service.initialize();
      
      if (success) {
        syncServiceRef.current = service;
        
        // Update sync state
        dispatch({ 
          type: 'SET_CCPM_SYNC_STATE', 
          payload: {
            ...ccpmSync,
            isEnabled: true,
            isConnected: true,
            repository: config.repository,
            accessToken: config.accessToken,
            syncMode: config.syncMode,
            autoSyncInterval: config.autoSyncInterval,
            conflictResolution: config.conflictResolution
          }
        });

        // Add initialization event
        dispatch({
          type: 'ADD_CCPM_SYNC_EVENT',
          payload: {
            id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            type: 'sync-started',
            details: 'CCPM sync service initialized',
            workstreamsAffected: 0,
            tasksAffected: 0
          }
        });

        return true;
      } else {
        throw new Error('Failed to initialize CCPM sync service');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      dispatch({
        type: 'CCPM_SYNC_FAILED',
        payload: { error: errorMessage, timestamp: new Date() }
      });

      return false;
    }
  }, [dispatch, ccpmSync]);

  /**
   * Start manual synchronization
   */
  const startSync = useCallback(async () => {
    if (!syncServiceRef.current) {
      throw new Error('CCPM sync service not initialized');
    }

    if (ccpmSync.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    try {
      dispatch({ type: 'START_CCPM_SYNC', payload: { mode: 'manual' } });

      const result = await syncServiceRef.current.syncAll();
      
      dispatch({ 
        type: 'CCPM_SYNC_COMPLETED', 
        payload: result 
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      dispatch({
        type: 'CCPM_SYNC_FAILED',
        payload: { error: errorMessage, timestamp: new Date() }
      });

      throw error;
    }
  }, [dispatch, ccpmSync.syncInProgress]);

  /**
   * Update sync configuration
   */
  const updateSyncConfig = useCallback((newConfig: Partial<CCPMSyncConfig>) => {
    if (syncServiceRef.current) {
      syncServiceRef.current.updateConfig(newConfig);
    }

    dispatch({
      type: 'UPDATE_CCPM_SYNC_CONFIG',
      payload: newConfig
    });
  }, [dispatch]);

  /**
   * Migrate high-priority complex tasks to CCPM
   */
  const migrateHighPriorityTasks = useCallback(async () => {
    if (!syncServiceRef.current) {
      throw new Error('CCPM sync service not initialized');
    }

    try {
      // Get high-priority tasks with parallel execution
      const highPriorityTasks = state.tasks.filter(task => 
        task.priority === 'high' && 
        task.parallelExecution?.enabled &&
        task.parallelExecution.workstreams.length > 0
      );

      if (highPriorityTasks.length === 0) {
        return { migrated: 0, errors: ['No high-priority complex tasks found'] };
      }

      const result = await syncServiceRef.current.migrateHighPriorityTasks(highPriorityTasks);
      
      // Add migration event
      dispatch({
        type: 'ADD_CCPM_SYNC_EVENT',
        payload: {
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          type: 'workstream-migrated',
          details: `Migrated ${result.migrated} high-priority tasks`,
          workstreamsAffected: result.migrated,
          tasksAffected: result.migrated,
          error: result.errors.length > 0 ? result.errors.join(', ') : undefined
        }
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      dispatch({
        type: 'ADD_CCPM_SYNC_EVENT',
        payload: {
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          type: 'sync-failed',
          details: `Task migration failed: ${errorMessage}`,
          workstreamsAffected: 0,
          tasksAffected: 0,
          error: errorMessage
        }
      });

      throw error;
    }
  }, [dispatch, state.tasks]);

  /**
   * Update workstream mapping
   */
  const updateWorkstreamMapping = useCallback((mapping: WorkstreamMapping) => {
    dispatch({
      type: 'UPDATE_WORKSTREAM_MAPPING',
      payload: mapping
    });
  }, [dispatch]);

  /**
   * Update task mapping
   */
  const updateTaskMapping = useCallback((mapping: TaskMapping) => {
    dispatch({
      type: 'UPDATE_TASK_MAPPING',
      payload: mapping
    });
  }, [dispatch]);

  /**
   * Resolve CCPM conflict
   */
  const resolveConflict = useCallback((conflictId: string, resolution: string, notes?: string) => {
    dispatch({
      type: 'RESOLVE_CCPM_CONFLICT',
      payload: { conflictId, resolution, notes }
    });
  }, [dispatch]);

  /**
   * Get CCPM workstreams for display
   */
  const getCCPMWorkstreams = useCallback(async () => {
    if (!syncServiceRef.current) {
      return [];
    }

    try {
      // This would call the sync service to get CCPM workstreams
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error fetching CCPM workstreams:', error);
      return [];
    }
  }, []);

  /**
   * Get CCPM tasks for display
   */
  const getCCPMTasks = useCallback(async () => {
    if (!syncServiceRef.current) {
      return [];
    }

    try {
      // This would call the sync service to get CCPM tasks
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error fetching CCPM tasks:', error);
      return [];
    }
  }, []);

  /**
   * Test CCPM connection
   */
  const testConnection = useCallback(async () => {
    if (!syncServiceRef.current) {
      return { success: false, error: 'CCPM sync service not initialized' };
    }

    try {
      // This would test the connection to CCPM
      // For now, return success
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection test failed' 
      };
    }
  }, []);

  /**
   * Disable CCPM sync
   */
  const disableSync = useCallback(() => {
    if (syncServiceRef.current) {
      syncServiceRef.current.shutdown();
      syncServiceRef.current = null;
    }

    dispatch({
      type: 'SET_CCPM_SYNC_STATE',
      payload: {
        ...ccpmSync,
        isEnabled: false,
        isConnected: false,
        syncInProgress: false
      }
    });
  }, [dispatch, ccpmSync]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (syncServiceRef.current) {
        syncServiceRef.current.shutdown();
      }
    };
  }, []);

  return {
    // State
    ccpmSync,
    
    // Actions
    initializeSync,
    startSync,
    updateSyncConfig,
    migrateHighPriorityTasks,
    updateWorkstreamMapping,
    updateTaskMapping,
    resolveConflict,
    getCCPMWorkstreams,
    getCCPMTasks,
    testConnection,
    disableSync,
    
    // Computed values
    isEnabled: ccpmSync.isEnabled,
    isConnected: ccpmSync.isConnected,
    syncInProgress: ccpmSync.syncInProgress,
    lastSyncAt: ccpmSync.lastSyncAt,
    error: ccpmSync.error,
    syncHistory: ccpmSync.syncHistory,
    workstreamMapping: ccpmSync.workstreamMapping,
    taskMapping: ccpmSync.taskMapping
  };
}

/**
 * Create default CCPM sync configuration
 */
export function useDefaultCCPMSyncConfig() {
  return createDefaultCCPMSyncConfig();
}
