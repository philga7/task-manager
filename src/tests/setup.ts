/**
 * Vitest Global Setup File
 * 
 * This file runs before all test files and sets up:
 * - Testing Library custom matchers (toBeInTheDocument, etc.)
 * - Global test utilities
 * - Mock configurations
 * 
 * Any setup that should apply to ALL tests goes here.
 */

import '@testing-library/jest-dom/vitest';

/**
 * Why we import @testing-library/jest-dom:
 * 
 * This import adds custom matchers to Vitest's expect function:
 * - toBeInTheDocument() - check if element is in the DOM
 * - toHaveTextContent() - check element's text content
 * - toHaveAttribute() - check element attributes
 * - toBeVisible() - check if element is visible
 * - toBeDisabled() - check if element is disabled
 * - And many more...
 * 
 * Without this import, these matchers wouldn't be available and
 * we'd have to use more verbose assertions.
 */

// You can add additional global setup here
// For example:
// - Mock window.matchMedia for responsive tests
// - Mock localStorage/sessionStorage
// - Set up global test data
// - Configure test timeouts

/**
 * Example: Mock window.matchMedia for responsive design tests
 * Uncomment if you need to test responsive components
 */
// Object.defineProperty(window, 'matchMedia', {
//   writable: true,
//   value: vi.fn().mockImplementation(query => ({
//     matches: false,
//     media: query,
//     onchange: null,
//     addListener: vi.fn(),
//     removeListener: vi.fn(),
//     addEventListener: vi.fn(),
//     removeEventListener: vi.fn(),
//     dispatchEvent: vi.fn(),
//   })),
// });

