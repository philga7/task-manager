import { logStorage } from './logger';

/**
 * Import backup data from production backup file
 */
export function importBackupData(backupData: Record<string, string>): {
  success: boolean;
  importedKeys: string[];
  errors: string[];
} {
  const importedKeys: string[] = [];
  const errors: string[] = [];

  try {
    logStorage.info('Starting backup data import');

    // Find the most recent user data (non-base64 encoded)
    const userDataKey = Object.keys(backupData).find(key => 
      key.includes('task-manager-state-user') && 
      !key.includes('_backup') && 
      !key.includes('_1755') // Avoid timestamped keys
    );

    if (userDataKey) {
      const userData = backupData[userDataKey];
      
      try {
        // Parse the user data
        const parsedData = JSON.parse(userData);
        
        // Store it in localStorage with the standard key
        localStorage.setItem('task-manager-state', userData);
        importedKeys.push('task-manager-state');
        
        logStorage.info('Successfully imported user data', {
          tasks: parsedData.tasks?.length || 0,
          projects: parsedData.projects?.length || 0,
          goals: parsedData.goals?.length || 0
        });
        
      } catch (parseError) {
        errors.push(`Failed to parse user data: ${parseError}`);
      }
    } else {
      errors.push('No valid user data found in backup');
    }

    // Also import authentication data if available
    const authKeys = Object.keys(backupData).filter(key => 
      key.includes('task_manager_auth') || 
      key.includes('task_manager_session') ||
      key.includes('task_manager_users')
    );

    authKeys.forEach(key => {
      try {
        const data = backupData[key];
        
        // Check if it's base64 encoded
        if (data && data.length > 0 && !data.startsWith('{')) {
          // Try to decode base64
          try {
            const decoded = atob(data);
            localStorage.setItem(key, decoded);
            importedKeys.push(key);
            logStorage.info(`Imported base64 decoded data for key: ${key}`);
          } catch (decodeError) {
            // If base64 decode fails, store as-is
            localStorage.setItem(key, data);
            importedKeys.push(key);
            logStorage.info(`Imported raw data for key: ${key}`);
          }
        } else {
          // Store as-is if it's already JSON
          localStorage.setItem(key, data);
          importedKeys.push(key);
          logStorage.info(`Imported JSON data for key: ${key}`);
        }
      } catch (error) {
        errors.push(`Failed to import ${key}: ${error}`);
      }
    });

    logStorage.info('Backup import completed', {
      importedKeys: importedKeys.length,
      errors: errors.length
    });

    return {
      success: importedKeys.length > 0,
      importedKeys,
      errors
    };

  } catch (error) {
    logStorage.error('Backup import failed', error);
    return {
      success: false,
      importedKeys: [],
      errors: [`Import failed: ${error}`]
    };
  }
}

/**
 * Import backup data from a file path
 */
export async function importBackupFromFile(filePath: string): Promise<{
  success: boolean;
  importedKeys: string[];
  errors: string[];
}> {
  try {
    // Read the backup file
    const response = await fetch(filePath);
    const backupData = await response.json();
    
    return importBackupData(backupData);
  } catch (error) {
    logStorage.error('Failed to read backup file', error);
    return {
      success: false,
      importedKeys: [],
      errors: [`Failed to read backup file: ${error}`]
    };
  }
}
