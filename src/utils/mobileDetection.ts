/**
 * Mobile Browser Detection and Compatibility Utilities
 * Handles iOS Safari and Android Chrome specific issues
 */

export interface MobileBrowserInfo {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isPrivateBrowsing: boolean;
  browserName: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
  supportsLocalStorage: boolean;
  supportsSessionStorage: boolean;
  supportsIndexedDB: boolean;
  supportsCookies: boolean;
  storageQuota: number | null;
  hasStorageQuota: boolean;
}

/**
 * Detect mobile browser and capabilities
 */
export function detectMobileBrowser(): MobileBrowserInfo {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  
  // Basic detection
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(userAgent);
  const isMobile = isIOS || isAndroid || /Mobile|Tablet/.test(userAgent);
  
  // Browser detection
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isChrome = /Chrome/.test(userAgent) && !/Edge/.test(userAgent);
  
  // OS detection
  const osName = isIOS ? 'iOS' : isAndroid ? 'Android' : 'Unknown';
  const osVersion = extractOSVersion(userAgent, osName);
  
  // Browser version
  const browserName = isSafari ? 'Safari' : isChrome ? 'Chrome' : 'Unknown';
  const browserVersion = extractBrowserVersion(userAgent, browserName);
  
  // Storage capability detection
  const supportsLocalStorage = testLocalStorage();
  const supportsSessionStorage = testSessionStorage();
  const supportsIndexedDB = testIndexedDB();
  const supportsCookies = testCookies();
  
  // Private browsing detection (pass browser info to avoid circular dependency)
  const isPrivateBrowsing = detectPrivateBrowsing(isIOS, isAndroid, isSafari, isChrome);
  
  // Storage quota estimation (pass browser info to avoid circular dependency)
  const storageQuota = estimateStorageQuota(isIOS, isAndroid, isSafari, isChrome, isMobile, isPrivateBrowsing);
  const hasStorageQuota = storageQuota !== null;
  
  return {
    isMobile,
    isIOS,
    isAndroid,
    isSafari,
    isChrome,
    isPrivateBrowsing,
    browserName,
    browserVersion,
    osName,
    osVersion,
    supportsLocalStorage,
    supportsSessionStorage,
    supportsIndexedDB,
    supportsCookies,
    storageQuota,
    hasStorageQuota
  };
}

/**
 * Extract OS version from user agent
 */
function extractOSVersion(userAgent: string, osName: string): string {
  if (osName === 'iOS') {
    const match = userAgent.match(/OS (\d+_\d+)/);
    return match ? match[1].replace('_', '.') : 'Unknown';
  } else if (osName === 'Android') {
    const match = userAgent.match(/Android (\d+\.\d+)/);
    return match ? match[1] : 'Unknown';
  }
  return 'Unknown';
}

/**
 * Extract browser version from user agent
 */
function extractBrowserVersion(userAgent: string, browserName: string): string {
  if (browserName === 'Safari') {
    const match = userAgent.match(/Version\/(\d+\.\d+)/);
    return match ? match[1] : 'Unknown';
  } else if (browserName === 'Chrome') {
    const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
    return match ? match[1] : 'Unknown';
  }
  return 'Unknown';
}

/**
 * Test localStorage availability
 */
function testLocalStorage(): boolean {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Test sessionStorage availability
 */
function testSessionStorage(): boolean {
  try {
    const testKey = '__sessionStorage_test__';
    sessionStorage.setItem(testKey, 'test');
    sessionStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Test IndexedDB availability
 */
function testIndexedDB(): boolean {
  try {
    return 'indexedDB' in window && indexedDB !== null;
  } catch {
    return false;
  }
}

/**
 * Test cookies availability
 */
function testCookies(): boolean {
  try {
    document.cookie = 'test=1';
    const hasCookie = document.cookie.indexOf('test=') !== -1;
    document.cookie = 'test=1; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    return hasCookie;
  } catch {
    return false;
  }
}

/**
 * Detect private browsing mode
 */
function detectPrivateBrowsing(isIOS: boolean, isAndroid: boolean, isSafari: boolean, isChrome: boolean): boolean {
  // iOS Safari private browsing detection
  if (isIOS && isSafari) {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return false;
    } catch {
      return true;
    }
  }
  
  // Android Chrome incognito detection
  if (isAndroid && isChrome) {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return false;
    } catch {
      return true;
    }
  }
  
  return false;
}

/**
 * Estimate available storage quota
 */
function estimateStorageQuota(isIOS: boolean, isAndroid: boolean, isSafari: boolean, isChrome: boolean, isMobile: boolean, isPrivateBrowsing: boolean): number | null {
  // iOS Safari has very limited localStorage in private browsing
  if (isIOS && isSafari && isPrivateBrowsing) {
    return 0; // No localStorage in private browsing
  }
  
  // iOS Safari regular browsing
  if (isIOS && isSafari) {
    return 5 * 1024 * 1024; // ~5MB
  }
  
  // Android Chrome
  if (isAndroid && isChrome) {
    return 10 * 1024 * 1024; // ~10MB
  }
  
  // Default mobile browsers
  if (isMobile) {
    return 5 * 1024 * 1024; // ~5MB
  }
  
  // Desktop browsers
  return 50 * 1024 * 1024; // ~50MB
}

/**
 * Get recommended storage strategy for current browser
 */
export function getRecommendedStorageStrategy(): {
  primary: 'localStorage' | 'sessionStorage' | 'indexedDB' | 'cookies' | 'memory';
  fallbacks: Array<'localStorage' | 'sessionStorage' | 'indexedDB' | 'cookies' | 'memory'>;
  maxDataSize: number;
} {
  const browserInfo = detectMobileBrowser();
  
  // iOS Safari private browsing - use sessionStorage and memory
  if (browserInfo.isIOS && browserInfo.isSafari && browserInfo.isPrivateBrowsing) {
    return {
      primary: 'sessionStorage',
      fallbacks: ['memory', 'cookies'],
      maxDataSize: 1 * 1024 * 1024 // 1MB limit for private browsing
    };
  }
  
  // iOS Safari regular browsing
  if (browserInfo.isIOS && browserInfo.isSafari) {
    return {
      primary: 'localStorage',
      fallbacks: ['sessionStorage', 'indexedDB', 'cookies'],
      maxDataSize: 4 * 1024 * 1024 // 4MB to be safe
    };
  }
  
  // Android Chrome
  if (browserInfo.isAndroid && browserInfo.isChrome) {
    return {
      primary: 'localStorage',
      fallbacks: ['indexedDB', 'sessionStorage', 'cookies'],
      maxDataSize: 8 * 1024 * 1024 // 8MB to be safe
    };
  }
  
  // Other mobile browsers
  if (browserInfo.isMobile) {
    return {
      primary: 'localStorage',
      fallbacks: ['sessionStorage', 'cookies', 'memory'],
      maxDataSize: 4 * 1024 * 1024 // 4MB to be safe
    };
  }
  
  // Desktop browsers
  return {
    primary: 'localStorage',
    fallbacks: ['indexedDB', 'sessionStorage', 'cookies'],
    maxDataSize: 40 * 1024 * 1024 // 40MB to be safe
  };
}

/**
 * Check if current browser has known compatibility issues
 */
export function hasCompatibilityIssues(): {
  hasIssues: boolean;
  issues: string[];
  recommendations: string[];
} {
  const browserInfo = detectMobileBrowser();
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // iOS Safari private browsing issues
  if (browserInfo.isIOS && browserInfo.isSafari && browserInfo.isPrivateBrowsing) {
    issues.push('iOS Safari private browsing mode has no localStorage support');
    recommendations.push('Use sessionStorage for temporary data storage');
    recommendations.push('Implement data export/import functionality');
  }
  
  // iOS Safari storage limitations
  if (browserInfo.isIOS && browserInfo.isSafari) {
    issues.push('iOS Safari has limited localStorage quota');
    recommendations.push('Implement data compression');
    recommendations.push('Add storage quota monitoring');
  }
  
  // Android Chrome storage issues
  if (browserInfo.isAndroid && browserInfo.isChrome) {
    if (!browserInfo.supportsLocalStorage) {
      issues.push('Android Chrome localStorage not available');
      recommendations.push('Use IndexedDB as primary storage');
    }
  }
  
  // General mobile storage limitations
  if (browserInfo.isMobile && browserInfo.storageQuota && browserInfo.storageQuota < 5 * 1024 * 1024) {
    issues.push('Limited storage quota on mobile device');
    recommendations.push('Implement data cleanup strategies');
    recommendations.push('Add storage usage monitoring');
  }
  
  return {
    hasIssues: issues.length > 0,
    issues,
    recommendations
  };
}

/**
 * Get user-friendly browser information for debugging
 */
export function getBrowserInfoForUser(): string {
  const browserInfo = detectMobileBrowser();
  const compatibility = hasCompatibilityIssues();
  
  let info = `Browser: ${browserInfo.browserName} ${browserInfo.browserVersion}\n`;
  info += `OS: ${browserInfo.osName} ${browserInfo.osVersion}\n`;
  info += `Mobile: ${browserInfo.isMobile ? 'Yes' : 'No'}\n`;
  info += `Private Browsing: ${browserInfo.isPrivateBrowsing ? 'Yes' : 'No'}\n`;
  info += `Storage Quota: ${browserInfo.storageQuota ? `${Math.round(browserInfo.storageQuota / 1024 / 1024)}MB` : 'Unknown'}\n`;
  
  if (compatibility.hasIssues) {
    info += '\nCompatibility Issues:\n';
    compatibility.issues.forEach(issue => {
      info += `- ${issue}\n`;
    });
    
    info += '\nRecommendations:\n';
    compatibility.recommendations.forEach(rec => {
      info += `- ${rec}\n`;
    });
  }
  
  return info;
}
