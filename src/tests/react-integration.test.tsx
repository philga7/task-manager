/**
 * Test Suite: React Testing Library Integration
 * Purpose: Verify React component testing capabilities with jsdom
 * 
 * This test file validates:
 * 1. React component rendering
 * 2. jsdom environment setup
 * 3. Testing Library queries
 * 4. Custom matchers from @testing-library/jest-dom
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

/**
 * Simple test component to validate React rendering
 */
function TestComponent() {
  return (
    <div>
      <h1>Hello, Vitest!</h1>
      <button>Click me</button>
      <input type="text" placeholder="Enter text" />
    </div>
  );
}

describe('React Testing Library Integration', () => {
  /**
   * Test Case 1: Basic Component Rendering
   * Validates that React components can be rendered in jsdom
   */
  it('should render React components', () => {
    // Act
    render(<TestComponent />);
    
    // Assert - using Testing Library queries
    const heading = screen.getByText('Hello, Vitest!');
    expect(heading).toBeDefined();
  });

  /**
   * Test Case 2: DOM Queries
   * Validates that Testing Library queries work correctly
   */
  it('should support Testing Library queries', () => {
    // Act
    render(<TestComponent />);
    
    // Assert - multiple query types
    expect(screen.getByRole('heading')).toBeDefined();
    expect(screen.getByRole('button')).toBeDefined();
    expect(screen.getByPlaceholderText('Enter text')).toBeDefined();
  });

  /**
   * Test Case 3: Custom Matchers
   * Validates that @testing-library/jest-dom matchers are available
   */
  it('should support jest-dom custom matchers', () => {
    // Act
    render(<TestComponent />);
    
    // Assert - using custom matchers from jest-dom
    const heading = screen.getByText('Hello, Vitest!');
    const button = screen.getByRole('button');
    
    expect(heading).toBeInTheDocument();
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
  });

  /**
   * Test Case 4: Element Attributes
   * Validates that we can test element attributes and properties
   */
  it('should test element attributes', () => {
    // Act
    render(<TestComponent />);
    
    // Assert
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('placeholder', 'Enter text');
  });
});

