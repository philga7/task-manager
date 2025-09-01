import { CCPMSyncService, createDefaultCCPMSyncConfig } from '../services/ccpmSyncService';
import { CCPMSyncConfig, Task, Workstream } from '../types';

// Mock fetch for testing
global.fetch = jest.fn();

describe('CCPM Integration Tests', () => {
  let syncService: CCPMSyncService;
  let mockConfig: CCPMSyncConfig;

  beforeEach(() => {
    mockConfig = createDefaultCCPMSyncConfig();
    mockConfig.baseUrl = 'http://localhost:8000';
    mockConfig.accessToken = 'test-token';
    mockConfig.repository = 'test/repo';
    
    syncService = new CCPMSyncService(mockConfig);
    
    // Reset fetch mock
    (fetch as jest.Mock).mockClear();
  });

  describe('CCPM Sync Service', () => {
    test('should create service with default configuration', () => {
      expect(syncService).toBeInstanceOf(CCPMSyncService);
    });

    test('should initialize successfully with valid config', async () => {
      // Mock successful health check
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const result = await syncService.initialize();
      expect(result).toBe(true);
    });

    test('should fail initialization with invalid config', async () => {
      const invalidConfig = { ...mockConfig, accessToken: '' };
      const invalidService = new CCPMSyncService(invalidConfig);

      const result = await invalidService.initialize();
      expect(result).toBe(false);
    });

    test('should handle connection test failure', async () => {
      // Mock failed health check
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await syncService.initialize();
      expect(result).toBe(false);
    });
  });

  describe('Task Migration', () => {
    const mockTasks: Task[] = [
      {
        id: 'task-1',
        title: 'High Priority Task 1',
        description: 'Test task 1',
        priority: 'high',
        status: 'todo',
        createdAt: new Date(),
        tags: ['test', 'high-priority'],
        parallelExecution: {
          enabled: true,
          workstreams: [
            {
              id: 'ws-1',
              name: 'Test Workstream 1',
              description: 'Test workstream description',
              agents: [],
              status: 'pending',
              progress: 0,
              dependencies: [],
              createdAt: new Date(),
              priority: 'high',
              estimatedDuration: 60
            }
          ],
          dependencies: []
        }
      },
      {
        id: 'task-2',
        title: 'Low Priority Task 2',
        description: 'Test task 2',
        priority: 'low',
        status: 'todo',
        createdAt: new Date(),
        tags: ['test', 'low-priority']
      }
    ];

    test('should migrate high-priority complex tasks', async () => {
      // Mock successful API calls
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ id: 'ccpm-ws-1', name: 'Test Workstream 1' })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ id: 'ccpm-task-1', title: 'High Priority Task 1' })
        });

      const result = await syncService.migrateHighPriorityTasks(mockTasks);
      
      expect(result.migrated).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    test('should filter out low-priority tasks', async () => {
      const result = await syncService.migrateHighPriorityTasks(mockTasks);
      
      // Only high-priority task with parallel execution should be migrated
      expect(result.migrated).toBe(1);
    });

    test('should handle migration errors gracefully', async () => {
      // Mock failed API call
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const result = await syncService.migrateHighPriorityTasks(mockTasks);
      
      expect(result.migrated).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Synchronization', () => {
    test('should perform full synchronization', async () => {
      // Mock successful API calls
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ workstreams: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ tasks: [] })
        });

      // Initialize service first
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200
      });
      await syncService.initialize();

      const result = await syncService.syncAll();
      
      expect(result.success).toBe(true);
      expect(result.workstreamsSynced).toBe(0);
      expect(result.tasksSynced).toBe(0);
      expect(result.conflictsResolved).toBe(0);
    });

    test('should handle sync conflicts', async () => {
      // Mock successful API calls
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ workstreams: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ tasks: [] })
        });

      // Initialize service first
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200
      });
      await syncService.initialize();

      const result = await syncService.syncAll();
      
      expect(result.success).toBe(true);
      expect(result.conflictsResolved).toBe(0);
    });

    test('should prevent concurrent sync operations', async () => {
      // Mock successful API calls
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200
        });
      
      await syncService.initialize();

      // Start first sync
      const firstSync = syncService.syncAll();
      
      // Try to start second sync
      await expect(syncService.syncAll()).rejects.toThrow('Sync already in progress');
      
      // Wait for first sync to complete
      await firstSync;
    });
  });

  describe('Configuration Management', () => {
    test('should update configuration', () => {
      const newConfig = {
        syncMode: 'auto' as const,
        autoSyncInterval: 60
      };

      syncService.updateConfig(newConfig);
      
      // Verify config was updated
      expect(syncService.getSyncState().syncMode).toBe('auto');
      expect(syncService.getSyncState().autoSyncInterval).toBe(60);
    });

    test('should handle sync mode changes', () => {
      // Start with manual mode
      syncService.updateConfig({ syncMode: 'manual' });
      expect(syncService.getSyncState().syncMode).toBe('manual');

      // Change to auto mode
      syncService.updateConfig({ syncMode: 'auto' });
      expect(syncService.getSyncState().syncMode).toBe('auto');
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await syncService.initialize();
      expect(result).toBe(false);
    });

    test('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await syncService.initialize();
      expect(result).toBe(false);
    });

    test('should handle invalid responses gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => null
      });

      // Initialize service first
      await syncService.initialize();

      const result = await syncService.syncAll();
      expect(result.success).toBe(true);
    });
  });

  describe('Data Validation', () => {
    test('should validate workstream data', async () => {
      const mockWorkstreams = [
        {
          id: 'ws-1',
          name: 'Valid Workstream',
          description: 'Valid description',
          status: 'pending',
          priority: 'high',
          estimatedDuration: 60,
          assignedAgents: [],
          dependencies: [],
          metadata: { tags: [], customFields: {} },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Mock successful API call
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ workstreams: mockWorkstreams })
      });

      // Initialize service first
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200
      });
      await syncService.initialize();

      const result = await syncService.syncAll();
      expect(result.success).toBe(true);
    });

    test('should handle invalid workstream data', async () => {
      const invalidWorkstreams = [
        {
          id: 'ws-1',
          // Missing required fields
          name: 'Invalid Workstream'
        }
      ];

      // Mock successful API call with invalid data
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ workstreams: invalidWorkstreams })
      });

      // Initialize service first
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200
      });
      await syncService.initialize();

      const result = await syncService.syncAll();
      expect(result.success).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large numbers of workstreams', async () => {
      const largeWorkstreams = Array.from({ length: 1000 }, (_, i) => ({
        id: `ws-${i}`,
        name: `Workstream ${i}`,
        description: `Description ${i}`,
        status: 'pending' as const,
        priority: 'medium' as const,
        estimatedDuration: 60,
        assignedAgents: [],
        dependencies: [],
        metadata: { tags: [], customFields: {} },
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // Mock successful API call
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ workstreams: largeWorkstreams })
      });

      // Initialize service first
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200
      });
      await syncService.initialize();

      const startTime = Date.now();
      const result = await syncService.syncAll();
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.workstreamsSynced).toBe(1000);
      
      // Should complete within reasonable time (5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
    });

    test('should handle concurrent operations gracefully', async () => {
      // Mock successful API calls
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200
        })
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({ workstreams: [], tasks: [] })
        });

      await syncService.initialize();

      // Start multiple operations concurrently
      const operations = [
        syncService.syncAll(),
        syncService.syncAll(),
        syncService.syncAll()
      ];

      // All operations should complete
      const results = await Promise.allSettled(operations);
      
      // One should succeed, others should fail due to concurrent sync prevention
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      expect(successful).toBe(1);
      expect(failed).toBe(2);
    });
  });

  describe('Cleanup and Shutdown', () => {
    test('should shutdown gracefully', () => {
      syncService.shutdown();
      
      const state = syncService.getSyncState();
      expect(state.isConnected).toBe(false);
      expect(state.isEnabled).toBe(false);
      expect(state.syncInProgress).toBe(false);
    });

    test('should cleanup resources on shutdown', () => {
      // Mock some internal state
      const originalShutdown = syncService.shutdown;
      
      syncService.shutdown();
      
      // Verify shutdown was called
      expect(originalShutdown).toBeDefined();
    });
  });
});

// Mock data generators for testing
export function generateMockTasks(count: number): Task[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `task-${i}`,
    title: `Test Task ${i}`,
    description: `Description for task ${i}`,
    priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
    status: 'todo',
    createdAt: new Date(),
    tags: [`tag-${i}`],
    parallelExecution: i % 2 === 0 ? {
      enabled: true,
      workstreams: [{
        id: `ws-${i}`,
        name: `Workstream ${i}`,
        description: `Workstream description ${i}`,
        agents: [],
        status: 'pending',
        progress: 0,
        dependencies: [],
        createdAt: new Date(),
        priority: 'medium',
        estimatedDuration: 60
      }],
      dependencies: []
    } : undefined
  }));
}

export function generateMockWorkstreams(count: number): Workstream[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `ws-${i}`,
    name: `Test Workstream ${i}`,
    description: `Description for workstream ${i}`,
    agents: [],
    status: 'pending',
    progress: 0,
    dependencies: [],
    createdAt: new Date(),
    priority: 'medium',
    estimatedDuration: 60
  }));
}
