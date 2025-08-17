/**
 * Simplified Mobile Browser Detection
 * Basic detection for essential mobile functionality
 */

export interface MobileBrowserInfo {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  browserName: string;
  supportsLocalStorage: boolean;
  supportsSessionStorage: boolean;
}

/**
 * Detect mobile browser and basic capabilities
 */
export function detectMobileBrowser(): MobileBrowserInfo {
  const userAgent = navigator.userAgent;
  
  // Basic detection
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  const isMobile = isIOS || isAndroid || /Mobile|Tablet/.test(userAgent);
  
  // Simple browser detection
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isChrome = /Chrome/.test(userAgent) && !/Edge/.test(userAgent);
  const browserName = isSafari ? 'Safari' : isChrome ? 'Chrome' : 'Unknown';
  
  // Storage capability detection
  const supportsLocalStorage = testLocalStorage();
  const supportsSessionStorage = testSessionStorage();
  
  return {
    isMobile,
    isIOS,
    isAndroid,
    browserName,
    supportsLocalStorage,
    supportsSessionStorage
  };
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
 * Get recommended storage strategy for current browser
 */
export function getRecommendedStorageStrategy(): {
  primary: 'localStorage' | 'sessionStorage';
  fallbacks: Array<'localStorage' | 'sessionStorage'>;
} {
  const browserInfo = detectMobileBrowser();
  
  // Simple strategy: try localStorage first, fallback to sessionStorage
  if (browserInfo.supportsLocalStorage) {
    return {
      primary: 'localStorage',
      fallbacks: ['sessionStorage']
    };
  }
  
  return {
    primary: 'sessionStorage',
    fallbacks: []
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
  
  // Only check for basic storage issues
  if (!browserInfo.supportsLocalStorage && !browserInfo.supportsSessionStorage) {
    issues.push('No storage support available');
    recommendations.push('Use a modern browser with storage support');
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
  
  let info = `Browser: ${browserInfo.browserName}\n`;
  info += `Mobile: ${browserInfo.isMobile ? 'Yes' : 'No'}\n`;
  info += `LocalStorage: ${browserInfo.supportsLocalStorage ? 'Available' : 'Not Available'}\n`;
  info += `SessionStorage: ${browserInfo.supportsSessionStorage ? 'Available' : 'Not Available'}\n`;
  
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
