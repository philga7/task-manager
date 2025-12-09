import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Vitest Configuration
 * 
 * This configuration sets up Vitest for testing React components with:
 * - jsdom environment for DOM simulation
 * - React Testing Library integration
 * - TypeScript support
 * - Global test utilities (describe, it, expect)
 * 
 * @see https://vitest.dev/config/
 */
export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom environment for React component testing
    environment: 'jsdom',
    
    // Enable global test APIs (describe, it, expect, etc.)
    // This allows us to use these without importing in every test file
    globals: true,
    
    // Setup files to run before each test file
    setupFiles: ['./src/tests/setup.ts'],
    
    // CSS handling - mock CSS imports to avoid parsing errors
    css: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '*.config.ts',
        '*.config.js',
        'dist/',
      ],
    },
    
    // Include test files
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    
    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
    ],
  },
});

