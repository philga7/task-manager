// Environment-based logging utility
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableProductionLogs: boolean;
}

// Default configuration
const defaultConfig: LogConfig = {
  level: 'info',
  enableConsole: true,
  enableProductionLogs: false
};

// Environment detection
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Configuration based on environment
const config: LogConfig = {
  ...defaultConfig,
  level: isProduction ? 'warn' : 'debug', // Allow warnings in production for debugging
  enableConsole: isDevelopment || (isProduction && defaultConfig.enableProductionLogs),
  enableProductionLogs: true // Enable production logs for debugging
};

// Log level priorities
const logLevels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Check if a log level should be output
function shouldLog(level: LogLevel): boolean {
  if (!config.enableConsole) return false;
  return logLevels[level] >= logLevels[config.level];
}

// Format log message with timestamp and level
function formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  if (args.length === 0) {
    return `${prefix} ${message}`;
  }
  
  return `${prefix} ${message}`;
}

// Main logging functions
export const logger = {
  debug: (message: string, ...args: unknown[]): void => {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message), ...args);
    }
  },
  
  info: (message: string, ...args: unknown[]): void => {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message), ...args);
    }
  },
  
  warn: (message: string, ...args: unknown[]): void => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message), ...args);
    }
  },
  
  error: (message: string, ...args: unknown[]): void => {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message), ...args);
    }
  }
};

// Configuration functions
export const configureLogger = (newConfig: Partial<LogConfig>): void => {
  Object.assign(config, newConfig);
};

export const getLoggerConfig = (): LogConfig => {
  return { ...config };
};

// Utility functions for specific use cases
export const logStorage = {
  save: (key: string, strategy: string): void => {
    logger.info(`State saved to ${strategy} storage key: ${key}`);
  },
  
  load: (key: string, strategy: string): void => {
    logger.info(`State loaded from ${strategy} storage key: ${key}`);
  },
  
  error: (operation: string, error: unknown): void => {
    logger.error(`Storage ${operation} failed:`, error);
  },
  
  warn: (message: string, ...args: unknown[]): void => {
    logger.warn(`Storage: ${message}`, ...args);
  }
};

export const logAuth = {
  session: (action: string, userId?: string): void => {
    logger.info(`Session ${action}${userId ? ` for user: ${userId}` : ''}`);
  },
  
  info: (message: string, ...args: unknown[]): void => {
    logger.info(`Authentication: ${message}`, ...args);
  },
  
  error: (operation: string, error: unknown): void => {
    logger.error(`Authentication ${operation} failed:`, error);
  },
  
  warn: (message: string, ...args: unknown[]): void => {
    logger.warn(`Authentication: ${message}`, ...args);
  }
};

export const logValidation = {
  error: (type: string, errors: unknown[]): void => {
    logger.error(`${type} validation failed:`, errors);
  },
  
  warn: (type: string, warnings: unknown[]): void => {
    logger.warn(`${type} validation warnings:`, warnings);
  }
};

export const logMilestone = {
  completion: (milestoneId: string, title: string, completed: boolean): void => {
    logger.info(`Milestone ${milestoneId} (${title}) ${completed ? 'completed' : 'uncompleted'} based on task status`);
  },
  
  manualUpdate: (milestoneId: string): void => {
    logger.info(`Preventing manual completion update for task-linked milestone ${milestoneId}`);
  },
  
  noTasks: (milestoneId: string): void => {
    logger.info(`Milestone ${milestoneId} has taskIds but no tasks found, keeping current status`);
  }
};

export const logProfile = {
  sync: (authName: string, authEmail: string, currentProfile: { name: string; email: string }): void => {
    logger.info('Profile data sync:', { authName, authEmail, currentProfile });
  },
  
  noSync: (): void => {
    logger.info('Profile data sync: No sync needed');
  },
  
  update: (payload: { name: string; email: string }): void => {
    logger.info('Profile update:', payload);
  }
};

export const logBrowser = {
  info: (browserInfo: unknown, compatibility: unknown): void => {
    logger.debug('Browser Info:', browserInfo);
    logger.debug('Compatibility:', compatibility);
  },
  
  warning: (message: string): void => {
    logger.warn('Mobile compatibility warning:', message);
  }
};

export const logState = {
  load: (storageKey: string): void => {
    logger.info(`Attempting to load state from storage key: ${storageKey}`);
  },
  
  loaded: (storageKey: string, method: string): void => {
    logger.info(`Loaded state from ${method} storage key: ${storageKey}`);
  },
  
  notFound: (): void => {
    logger.info('No saved state found, using initial state');
  },
  
  error: (operation: string, error: unknown): void => {
    logger.error(`State ${operation} failed:`, error);
  },
  
  authChange: (): void => {
    logger.info('Authentication state changed, loading user data...');
  }
};
