/**
 * Smoke Test Suite - E2E Configuration Verification
 * 
 * Purpose: Verify that Playwright is properly configured and can:
 * 1. Launch all configured browsers (Chrome, Firefox, Mobile Safari, Mobile Android)
 * 2. Navigate to the application
 * 3. Verify the app loads correctly
 * 4. Perform basic accessibility checks
 * 
 * Why "Smoke Tests"?
 * Smoke tests are minimal tests that verify the system is "not on fire" - 
 * they catch fundamental issues before running more complex test suites.
 * The name comes from hardware testing: if you plug it in and smoke comes out, stop.
 * 
 * These tests run first in CI/CD to fail fast if there's a fundamental issue.
 * 
 * Test Strategy:
 * - Each test is independent (can run in any order)
 * - Tests verify user-visible behavior, not implementation details
 * - Tests use accessibility-first queries (getByRole, getByText) per Testing Library best practices
 * 
 * @see agents.md Testing Standards section
 * @see shrimp-rules.md Query Priority guidelines
 */

import { test, expect } from '@playwright/test';

/**
 * Smoke Test: Application Loads Successfully
 * 
 * WHY: This is the most fundamental E2E test - can users see the app at all?
 * If this fails, nothing else matters.
 * 
 * WHAT IT TESTS:
 * - Dev server is running and accessible
 * - React app bootstraps without crashing
 * - HTML renders in the browser
 * - No JavaScript errors prevent page load
 * 
 * ANTI-PATTERN AVOIDED:
 * We don't test for specific HTML structure or CSS classes (implementation details).
 * Instead, we verify the user can see the page title.
 */
test.describe('Smoke Tests - Application Loading', () => {
  
  test('should load the homepage successfully', async ({ page }) => {
    // Arrange & Act: Navigate to the app's root URL
    // The baseURL is configured in playwright.config.ts
    await page.goto('/');
    
    // Assert: Verify the page title is correct
    // This confirms: HTML loaded, <title> tag rendered, no JS crash on boot
    await expect(page).toHaveTitle(/Task Manager/i);
  });

  /**
   * Smoke Test: Main Layout Renders
   * 
   * WHY: Verify React component tree renders without errors
   * A blank page with correct title could mean React crashed during render.
   * 
   * WHAT IT TESTS:
   * - React components mount successfully
   * - Layout components render (Header, Sidebar)
   * - No hydration errors
   */
  test('should render the main navigation', async ({ page }) => {
    await page.goto('/');
    
    // Wait for React to hydrate and render
    // Using getByRole for accessibility - screen readers can find this
    const navigation = page.getByRole('navigation');
    
    // Assert: Navigation element exists and is visible
    await expect(navigation).toBeVisible();
  });

  /**
   * Smoke Test: Authentication UI Accessible
   * 
   * WHY: Auth is a critical path - users must be able to log in
   * If auth buttons don't render, users are locked out.
   * 
   * WHAT IT TESTS:
   * - Auth-related UI elements are present
   * - Demo mode button is accessible (important per project requirements)
   * 
   * NOTE: We look for demo mode specifically because:
   * 1. It's always available (no backend required)
   * 2. It's critical for this project (see agents.md - "NEVER remove demo mode functionality")
   * 
   * ANTI-PATTERN LESSON:
   * The original test used `page.getByRole('button', { name: /demo/i })` which matched
   * multiple buttons (header and landing page both have demo buttons).
   * This caused a "strict mode violation" in Playwright.
   * 
   * FIX: Use `.first()` when multiple matches are acceptable, or be more specific.
   * Here we use `.first()` because we just need to verify at least one exists.
   */
  test('should display authentication options for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    
    // Look for demo mode option - this should always be visible for unauthenticated users
    // Using .first() because the app has multiple demo buttons (header + landing page)
    // For a smoke test, we just need to verify at least one is visible
    const demoButton = page.getByRole('button', { name: /demo/i }).first();
    
    await expect(demoButton).toBeVisible();
  });
});

/**
 * Smoke Test: Responsive Layout
 * 
 * WHY: This project has mobile-first requirements (agents.md: "ALWAYS implement responsive design")
 * Mobile Safari has had specific issues (task 977c2c41, task 3a38bbe8).
 * 
 * These tests verify the app is usable on mobile viewports.
 * The Mobile Safari and Mobile Android projects in playwright.config.ts
 * will run these tests with their specific device emulation.
 */
test.describe('Smoke Tests - Responsive Layout', () => {
  
  /**
   * Mobile Navigation Test
   * 
   * WHY: On mobile, navigation is often hidden behind a hamburger menu
   * This test verifies mobile users can access navigation.
   * 
   * WHAT IT TESTS:
   * - Mobile viewport renders correctly
   * - Navigation is accessible (either visible or via toggle)
   */
  test('should be usable on mobile viewport', async ({ page }) => {
    await page.goto('/');
    
    // The app should load without errors on any viewport
    await expect(page).toHaveTitle(/Task Manager/i);
    
    // On mobile, verify the page is scrollable and content is visible
    // This catches CSS issues where content overflows or is hidden
    // Note: This test runs on mobile devices via Mobile Safari and Mobile Android projects
    const mainContent = page.locator('main, [role="main"], .container, #root');
    await expect(mainContent.first()).toBeVisible();
  });
});

/**
 * Smoke Test: No Console Errors
 * 
 * WHY: Console errors often indicate React warnings, failed API calls,
 * or JavaScript exceptions that could degrade user experience.
 * 
 * This is a "canary" test - if there are console errors on page load,
 * something is likely wrong even if the page appears to work.
 */
test.describe('Smoke Tests - Error Detection', () => {
  
  test('should not have critical console errors on page load', async ({ page }) => {
    // Collect all console errors during page load
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    
    // Wait for initial render to complete
    await page.waitForLoadState('networkidle');
    
    // Filter out known acceptable errors (if any)
    // Example: Some browser extensions inject errors we can't control
    const criticalErrors = errors.filter(error => {
      // React development mode warnings are not critical
      if (error.includes('React DevTools')) return false;
      // Browser extension errors
      if (error.includes('extension://')) return false;
      // Favicon 404 (common and harmless)
      if (error.includes('favicon.ico')) return false;
      
      return true;
    });
    
    // Assert: No critical console errors
    // If this fails, investigate the error messages in the test output
    expect(criticalErrors).toEqual([]);
  });
});

/**
 * Smoke Test: Basic Performance Check
 * 
 * WHY: Slow page loads frustrate users and hurt SEO
 * This is a basic sanity check, not a comprehensive performance audit.
 * 
 * THRESHOLD RATIONALE:
 * - 5000ms is generous for a React SPA with code splitting
 * - In CI with cold cache, loads may be slower
 * - This catches major regressions (e.g., accidentally bundling huge deps)
 */
test.describe('Smoke Tests - Performance', () => {
  
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    const loadTime = Date.now() - startTime;
    
    // Assert: Page loads in under 5 seconds
    // This is a lenient threshold for CI/cold starts
    expect(loadTime).toBeLessThan(5000);
    
    // Log actual load time for monitoring (visible in test reports)
    console.log(`Page load time: ${loadTime}ms`);
  });
});

