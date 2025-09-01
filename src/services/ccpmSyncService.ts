import { 
  CCPMSyncState, 
  CCPMSyncConfig, 
  CCPMSyncResult, 
  CCPMSyncEvent, 
  CCPMWorkstream, 
  CCPMTask, 
  WorkstreamMapping, 
  TaskMapping, 
  CCPMConflict,
  Workstream,
  Task
} from '../types';

/**
 * CCPM Sync Service
 * Handles bidirectional synchronization between Shrimp Task Manager and CCPM
 */
export class CCPMSyncService {
  private config: CCPMSyncConfig;
  private syncState: CCPMSyncState;
  private isInitialized: boolean = false;

  constructor(config: CCPMSyncConfig) {
    this.config = config;
    this.syncState = {
      isEnabled: config.syncMode !== 'disabled',
      isConnected: false,
      lastSyncAt: null,
      syncInProgress: false,
      error: null,
      repository: config.repository,
      accessToken: config.accessToken,
      syncMode: config.syncMode,
      autoSyncInterval: config.autoSyncInterval,
      conflictResolution: config.conflictResolution,
      syncHistory: [],
      workstreamMapping: [],
      taskMapping: []
    };
  }

  /**
   * Initialize the sync service
   */
  async initialize(): Promise<boolean> {
    try {
      // Test connection to CCPM backend
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        throw new Error(`Failed to connect to CCPM: ${connectionTest.error}`);
      }

      this.syncState.isConnected = true;
      this.syncState.isEnabled = this.config.syncMode !== 'disabled';
      this.isInitialized = true;

      // Start auto-sync if enabled
      if (this.config.syncMode === 'auto') {
        this.startAutoSync();
      }

      return true;
    } catch (error) {
      this.syncState.error = error instanceof Error ? error.message : 'Unknown error';
      this.syncState.isConnected = false;
      return false;
    }
  }

  /**
   * Test connection to CCPM backend
   */
  private async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/health/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  /**
   * Start automatic synchronization
   */
  private startAutoSync(): void {
    if (this.config.syncMode !== 'auto') return;

    const intervalMs = this.config.autoSyncInterval * 60 * 1000;
    setInterval(() => {
      if (!this.syncState.syncInProgress) {
        this.syncAll();
      }
    }, intervalMs);
  }

  /**
   * Perform full synchronization
   */
  async syncAll(): Promise<CCPMSyncResult> {
    if (!this.isInitialized) {
      throw new Error('CCPM Sync Service not initialized');
    }

    if (this.syncState.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    const startTime = Date.now();
    this.syncState.syncInProgress = true;

    try {
      // Add sync start event
      this.addSyncEvent('sync-started', 'Full synchronization started', 0, 0);

      // Sync workstreams
      const workstreamResult = await this.syncWorkstreams();
      
      // Sync tasks
      const taskResult = await this.syncTasks();

      // Resolve conflicts
      const conflictsResolved = await this.resolveConflicts();

      const duration = (Date.now() - startTime) / 1000;
      const result: CCPMSyncResult = {
        success: true,
        workstreamsSynced: workstreamResult.synced,
        tasksSynced: taskResult.synced,
        conflictsResolved,
        errors: [...workstreamResult.errors, ...taskResult.errors],
        duration,
        timestamp: new Date()
      };

      // Add sync completion event
      this.addSyncEvent('sync-completed', 'Full synchronization completed', 
        workstreamResult.synced, taskResult.synced, undefined, duration);

      this.syncState.lastSyncAt = result.timestamp;
      this.syncState.syncInProgress = false;

      return result;

    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Add sync failure event
      this.addSyncEvent('sync-failed', `Sync failed: ${errorMessage}`, 0, 0, errorMessage, duration);

      this.syncState.error = errorMessage;
      this.syncState.syncInProgress = false;

      throw error;
    }
  }

  /**
   * Synchronize workstreams between Shrimp and CCPM
   */
  private async syncWorkstreams(): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      // Get workstreams from CCPM
      const ccpmWorkstreams = await this.getCCPMWorkstreams();
      
      // Get workstreams from Shrimp (this would come from the app state)
      // For now, we'll simulate this
      const shrimpWorkstreams: Workstream[] = [];

      // Create mappings for new workstreams
      for (const ccpmWs of ccpmWorkstreams) {
        const existingMapping = this.syncState.workstreamMapping.find(
          m => m.ccpmWorkstreamId === ccpmWs.id
        );

        if (!existingMapping) {
          // New workstream from CCPM - create mapping
          const mapping: WorkstreamMapping = {
            shrimpWorkstreamId: `shrimp-${ccpmWs.id}`,
            ccpmWorkstreamId: ccpmWs.id,
            lastSyncAt: new Date(),
            syncStatus: 'synced'
          };

          this.syncState.workstreamMapping.push(mapping);
          synced++;
        }
      }

      // Update existing mappings
      for (const mapping of this.syncState.workstreamMapping) {
        const ccpmWs = ccpmWorkstreams.find(ws => ws.id === mapping.ccpmWorkstreamId);
        if (ccpmWs) {
          mapping.lastSyncAt = new Date();
          mapping.syncStatus = 'synced';
        }
      }

    } catch (error) {
      errors.push(`Workstream sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { synced, errors };
  }

  /**
   * Synchronize tasks between Shrimp and CCPM
   */
  private async syncTasks(): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      // Get tasks from CCPM
      const ccpmTasks = await this.getCCPMTasks();
      
      // Get tasks from Shrimp (this would come from the app state)
      // For now, we'll simulate this
      const shrimpTasks: Task[] = [];

      // Create mappings for new tasks
      for (const ccpmTask of ccpmTasks) {
        const existingMapping = this.syncState.taskMapping.find(
          m => m.ccpmTaskId === ccpmTask.id
        );

        if (!existingMapping) {
          // New task from CCPM - create mapping
          const mapping: TaskMapping = {
            shrimpTaskId: `shrimp-${ccpmTask.id}`,
            ccpmTaskId: ccpmTask.id,
            lastSyncAt: new Date(),
            syncStatus: 'synced'
          };

          this.syncState.taskMapping.push(mapping);
          synced++;
        }
      }

      // Update existing mappings
      for (const mapping of this.syncState.taskMapping) {
        const ccpmTask = ccpmTasks.find(t => t.id === mapping.ccpmTaskId);
        if (ccpmTask) {
          mapping.lastSyncAt = new Date();
          mapping.syncStatus = 'synced';
        }
      }

    } catch (error) {
      errors.push(`Task sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { synced, errors };
  }

  /**
   * Resolve conflicts between Shrimp and CCPM data
   */
  private async resolveConflicts(): Promise<number> {
    let resolved = 0;

    try {
      // Check for conflicts in workstream mappings
      for (const mapping of this.syncState.workstreamMapping) {
        if (mapping.syncStatus === 'conflict') {
          // Apply conflict resolution strategy
          switch (this.config.conflictResolution) {
            case 'shrimp-wins':
              mapping.syncStatus = 'synced';
              mapping.conflictDetails = undefined;
              resolved++;
              break;
            case 'ccpm-wins':
              mapping.syncStatus = 'synced';
              mapping.conflictDetails = undefined;
              resolved++;
              break;
            case 'merge':
              // Implement merge logic here
              mapping.syncStatus = 'synced';
              mapping.conflictDetails = undefined;
              resolved++;
              break;
            case 'manual':
              // Leave conflict for manual resolution
              break;
          }
        }
      }

      // Check for conflicts in task mappings
      for (const mapping of this.syncState.taskMapping) {
        if (mapping.syncStatus === 'conflict') {
          // Apply conflict resolution strategy
          switch (this.config.conflictResolution) {
            case 'shrimp-wins':
              mapping.syncStatus = 'synced';
              mapping.conflictDetails = undefined;
              resolved++;
              break;
            case 'ccpm-wins':
              mapping.syncStatus = 'synced';
              mapping.conflictDetails = undefined;
              resolved++;
              break;
            case 'merge':
              // Implement merge logic here
              mapping.syncStatus = 'synced';
              mapping.conflictDetails = undefined;
              resolved++;
              break;
            case 'manual':
              // Leave conflict for manual resolution
              break;
          }
        }
      }

    } catch (error) {
      console.error('Error resolving conflicts:', error);
    }

    return resolved;
  }

  /**
   * Get workstreams from CCPM
   */
  private async getCCPMWorkstreams(): Promise<CCPMWorkstream[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/workstreams`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.workstreams || [];
    } catch (error) {
      console.error('Error fetching CCPM workstreams:', error);
      return [];
    }
  }

  /**
   * Get tasks from CCPM
   */
  private async getCCPMTasks(): Promise<CCPMTask[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/tasks`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.tasks || [];
    } catch (error) {
      console.error('Error fetching CCPM tasks:', error);
      return [];
    }
  }

  /**
   * Add a sync event to the history
   */
  private addSyncEvent(
    type: CCPMSyncEvent['type'],
    details: string,
    workstreamsAffected: number,
    tasksAffected: number,
    error?: string,
    duration?: number
  ): void {
    const event: CCPMSyncEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      details,
      workstreamsAffected,
      tasksAffected,
      error,
      duration
    };

    this.syncState.syncHistory.unshift(event);
    
    // Keep only the last 100 events
    if (this.syncState.syncHistory.length > 100) {
      this.syncState.syncHistory = this.syncState.syncHistory.slice(0, 100);
    }
  }

  /**
   * Get current sync state
   */
  getSyncState(): CCPMSyncState {
    return { ...this.syncState };
  }

  /**
   * Update sync configuration
   */
  updateConfig(newConfig: Partial<CCPMSyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update sync state if needed
    if (newConfig.syncMode !== undefined) {
      this.syncState.syncMode = newConfig.syncMode;
      this.syncState.isEnabled = newConfig.syncMode !== 'disabled';
      
      // Restart auto-sync if mode changed
      if (newConfig.syncMode === 'auto') {
        this.startAutoSync();
      }
    }
  }

  /**
   * Migrate high-priority complex tasks from Shrimp to CCPM
   */
  async migrateHighPriorityTasks(tasks: Task[]): Promise<{ migrated: number; errors: string[] }> {
    const errors: string[] = [];
    let migrated = 0;

    try {
      // Filter high-priority complex tasks
      const highPriorityTasks = tasks.filter(task => 
        task.priority === 'high' && 
        task.parallelExecution?.enabled &&
        task.parallelExecution.workstreams.length > 0
      );

      for (const task of highPriorityTasks) {
        try {
          // Create workstream in CCPM
          const workstream = await this.createCCPMWorkstream(task);
          
          // Create task in CCPM
          const ccpmTask = await this.createCCPMTask(task, workstream.id);
          
          // Create mapping
          const taskMapping: TaskMapping = {
            shrimpTaskId: task.id,
            ccpmTaskId: ccpmTask.id,
            lastSyncAt: new Date(),
            syncStatus: 'synced'
          };

          this.syncState.taskMapping.push(taskMapping);
          migrated++;

          // Add migration event
          this.addSyncEvent('task-migrated', `Migrated task: ${task.title}`, 0, 1);

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to migrate task ${task.id}: ${errorMsg}`);
        }
      }

    } catch (error) {
      errors.push(`Task migration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { migrated, errors };
  }

  /**
   * Create a workstream in CCPM
   */
  private async createCCPMWorkstream(task: Task): Promise<CCPMWorkstream> {
    if (!task.parallelExecution?.workstreams.length) {
      throw new Error('Task has no workstreams to migrate');
    }

    const shrimpWorkstream = task.parallelExecution.workstreams[0]; // Use first workstream

    const response = await fetch(`${this.config.baseUrl}/api/v1/workstreams`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: shrimpWorkstream.name,
        description: shrimpWorkstream.description,
        priority: task.priority,
        estimatedDuration: shrimpWorkstream.estimatedDuration || 60,
        metadata: {
          tags: task.tags,
          customFields: {
            shrimpTaskId: task.id,
            shrimpWorkstreamId: shrimpWorkstream.id
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Create a task in CCPM
   */
  private async createCCPMTask(task: Task, workstreamId: string): Promise<CCPMTask> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: task.title,
        description: task.description,
        priority: task.priority,
        workstreamId,
        estimatedDuration: task.parallelExecution?.estimatedTotalDuration || 30,
        tags: task.tags,
        metadata: {
          customFields: {
            shrimpTaskId: task.id,
            shrimpProjectId: task.projectId
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Shutdown the sync service
   */
  shutdown(): void {
    this.isInitialized = false;
    this.syncState.isConnected = false;
    this.syncState.syncInProgress = false;
  }
}

/**
 * Create a default CCPM sync configuration
 */
export function createDefaultCCPMSyncConfig(): CCPMSyncConfig {
  return {
    repository: '',
    accessToken: '',
    baseUrl: 'http://localhost:8000',
    syncMode: 'disabled',
    autoSyncInterval: 30,
    conflictResolution: 'manual',
    enableWorkstreamSync: true,
    enableTaskSync: true,
    enableRealTimeSync: false,
    maxRetryAttempts: 3,
    retryDelay: 5
  };
}
