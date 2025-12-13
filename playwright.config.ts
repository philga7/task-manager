/**
 * Playwright Configuration for Task Manager E2E Testing
 * 
 * This configuration sets up Playwright for comprehensive E2E testing across:
 * - Desktop browsers: Chrome (Chromium), Firefox, Safari (WebKit)
 * - Mobile browsers: Mobile Safari (iPhone), Mobile Chrome (Android)
 * 
 * Test Requirements Coverage:
 * - Chrome: Primary desktop browser - most users
 * - Firefox: Gecko engine verification - ensures cross-browser compatibility
 * - Mobile Safari: iPhone users - critical for iOS-specific storage quirks (see Safari task issues)
 * - Mobile Android: Android Chrome users - validates mobile responsiveness
 * 
 * Why these specific devices?
 * - iPhone 14: Modern iOS device with current Safari version
 * - Pixel 7: Modern Android device representing typical Android user
 * 
 * CI/CD Integration:
 * - Uses Playwright Docker container (mcr.microsoft.com/playwright:v1.55.0-noble) in CI
 * - Container has pre-installed browsers, saving 30-45 seconds per run
 * 
 * @see https://playwright.dev/docs/test-configuration
 * @see agents.md for project testing standards
 */

import { defineConfig, devices } from '@playwright/test';

/**
 * Environment Configuration
 * 
 * CI detection allows us to configure:
 * - Longer timeouts in CI (network latency)
 * - Headless-only execution
 * - Retry on failure (flaky test mitigation)
 * - Parallel execution based on available workers
 */
const isCI = !!process.env.CI;

export default defineConfig({
  // Test file location - separate from unit tests
  testDir: './tests/e2e',
  
  // Run tests in parallel for faster execution
  // In CI: use all available workers for speed
  // Locally: limit to 1 for debugging ease (can override with --workers)
  fullyParallel: true,
  workers: isCI ? undefined : 1,
  
  // Fail the build on CI if test.only is accidentally left in code
  // This prevents incomplete test suites from being merged
  forbidOnly: isCI,
  
  // Retry failed tests - flaky test mitigation
  // CI: 2 retries to handle transient failures
  // Local: 0 retries for immediate feedback during development
  retries: isCI ? 2 : 0,
  
  // Reporter configuration
  // Local: 'list' for concise output during development
  // CI: 'html' for detailed reports with screenshots and traces
  reporter: isCI ? 'html' : 'list',
  
  // Shared settings for all projects (browser configurations)
  use: {
    // Base URL for the dev server
    // Tests use relative URLs: page.goto('/') instead of full URL
    baseURL: 'http://localhost:5173',
    
    // Collect trace on failure for debugging
    // 'on-first-retry' = only capture trace when a test fails and retries
    // This balances debugging capability with performance
    trace: 'on-first-retry',
    
    // Screenshot on failure for visual debugging
    // Helps identify layout issues, especially on mobile viewports
    screenshot: 'only-on-failure',
    
    // Video recording - only on failure to save storage
    video: 'retain-on-failure',
    
    // Action timeout - fail fast on broken selectors
    actionTimeout: 10000,
    
    // Navigation timeout - allow for slower page loads in CI
    navigationTimeout: 30000,
  },
  
  // Browser/Device configurations to test against
  // Each "project" represents a browser/device combination
  projects: [
    /**
     * Desktop Chrome (Chromium)
     * 
     * Why: Primary browser for ~65% of users
     * Tests: Full functionality, localStorage, sessionStorage
     * Engine: Blink (same as Edge, Opera, Brave)
     */
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        // Viewport size for consistent screenshots
        viewport: { width: 1280, height: 720 },
      },
    },
    
    /**
     * Desktop Firefox
     * 
     * Why: Second most popular browser, different engine (Gecko)
     * Tests: Cross-browser compatibility, different JS engine behavior
     * Engine: SpiderMonkey (Gecko)
     */
    {
      name: 'Desktop Firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
    },
    
    /**
     * Mobile Safari (iPhone 14)
     * 
     * Why: Critical for iOS users - Safari has unique storage behavior
     * Note: This project has had Safari-specific task loading issues (see task 977c2c41)
     * Tests: Mobile viewport, touch interactions, iOS Safari storage quirks
     * Engine: WebKit
     * 
     * IMPORTANT: Mobile Safari testing is crucial because:
     * 1. Different localStorage behavior in Private Browsing
     * 2. Safari-specific storage quota limitations
     * 3. Touch event handling differs from desktop
     */
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 14'],
        // isMobile: true is set by device preset
        // Enables touch emulation and mobile viewport
      },
    },
    
    /**
     * Mobile Chrome (Android - Pixel 7)
     * 
     * Why: Most popular mobile browser globally
     * Tests: Android-specific behaviors, mobile Chrome rendering
     * Engine: Blink (same as desktop Chrome)
     * 
     * Note: While engine is same as desktop Chrome, mobile Chrome has:
     * - Different viewport handling
     * - Touch-first interactions
     * - Mobile-specific CSS behaviors (viewport units, safe-area-inset)
     */
    {
      name: 'Mobile Android',
      use: { 
        ...devices['Pixel 7'],
        // Uses Chromium with mobile viewport and touch emulation
      },
    },
  ],
  
  // Development server configuration
  // Playwright will automatically start the dev server before tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    // Reuse existing server if already running
    reuseExistingServer: !isCI,
    // Timeout for server startup
    timeout: 120 * 1000,
    // Output server logs for debugging startup issues
    stdout: 'pipe',
    stderr: 'pipe',
  },
  
  // Output directories for test artifacts
  // These are added to .gitignore
  outputDir: 'test-results',
  
  // Global timeout for each test
  // 30 seconds should be enough for most E2E scenarios
  timeout: 30 * 1000,
  
  // Expect timeout - how long to wait for expect assertions
  expect: {
    timeout: 5 * 1000,
  },
});

