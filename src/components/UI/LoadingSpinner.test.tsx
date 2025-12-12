/**
 * Test Suite: LoadingSpinner Component
 * Purpose: Validate LoadingSpinner and LoadingOverlay components
 * 
 * This test demonstrates:
 * 1. Spinner icon rendering
 * 2. Size variants (sm, md, lg)
 * 3. Optional text display
 * 4. Custom className application
 * 5. Animation classes
 * 6. LoadingOverlay behavior
 * 7. Conditional rendering based on loading state
 * 
 * Testing Methodology: Test-Driven Development (TDD)
 * - RED: Write failing tests first ✅
 * - GREEN: Implement minimal code to pass
 * - REFACTOR: Improve code quality
 * 
 * @see src/components/UI/LoadingSpinner.tsx
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LoadingSpinner, LoadingOverlay } from './LoadingSpinner';

describe('LoadingSpinner Component', () => {
  /**
   * Test Case 1: Basic Rendering
   * Validates that the spinner renders with icon
   */
  it('should render spinner icon', () => {
    // Arrange & Act
    const { container } = render(<LoadingSpinner />);

    // Assert
    // Lucide icons render as SVG elements
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('animate-spin');
  });

  /**
   * Test Case 2: Default Size
   * Validates that medium size is applied by default
   */
  it('should apply default medium size', () => {
    // Arrange & Act
    const { container } = render(<LoadingSpinner />);
    const svg = container.querySelector('svg');

    // Assert
    expect(svg).toHaveClass('w-6', 'h-6');
  });

  /**
   * Test Case 3: Small Size
   * Validates that small size variant applies correct classes
   */
  it('should apply small size classes', () => {
    // Arrange & Act
    const { container } = render(<LoadingSpinner size="sm" />);
    const svg = container.querySelector('svg');

    // Assert
    expect(svg).toHaveClass('w-4', 'h-4');
  });

  /**
   * Test Case 4: Large Size
   * Validates that large size variant applies correct classes
   */
  it('should apply large size classes', () => {
    // Arrange & Act
    const { container } = render(<LoadingSpinner size="lg" />);
    const svg = container.querySelector('svg');

    // Assert
    expect(svg).toHaveClass('w-8', 'h-8');
  });

  /**
   * Test Case 5: Optional Text Display
   * Validates that text is rendered when provided
   */
  it('should render optional text', () => {
    // Arrange & Act
    render(<LoadingSpinner text="Loading data..." />);

    // Assert
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  /**
   * Test Case 6: No Text by Default
   * Validates that text is not rendered when not provided
   */
  it('should not render text when not provided', () => {
    // Arrange & Act
    const { container } = render(<LoadingSpinner />);

    // Assert
    const textElement = container.querySelector('span');
    expect(textElement).toBeNull();
  });

  /**
   * Test Case 7: Custom ClassName
   * Validates that custom classes are applied
   */
  it('should apply custom className', () => {
    // Arrange & Act
    const { container } = render(<LoadingSpinner className="custom-spinner" />);
    const wrapper = container.firstChild as HTMLElement;

    // Assert
    expect(wrapper).toHaveClass('custom-spinner');
    expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center');
  });

  /**
   * Test Case 8: Animation Classes
   * Validates that spinner has animate-spin class
   */
  it('should have animate-spin class', () => {
    // Arrange & Act
    const { container } = render(<LoadingSpinner />);
    const svg = container.querySelector('svg');

    // Assert
    expect(svg).toHaveClass('animate-spin');
  });

  /**
   * Test Case 9: Color Classes
   * Validates that spinner has correct color
   */
  it('should have amber-500 color', () => {
    // Arrange & Act
    const { container } = render(<LoadingSpinner />);
    const svg = container.querySelector('svg');

    // Assert
    expect(svg).toHaveClass('text-amber-500');
  });

  /**
   * Test Case 10: Text Styling
   * Validates that text has correct styling classes
   */
  it('should apply correct text styling', () => {
    // Arrange & Act
    render(<LoadingSpinner text="Loading..." />);
    const textElement = screen.getByText('Loading...');

    // Assert
    expect(textElement).toHaveClass('text-sm', 'text-stone-400');
  });

  /**
   * Test Case 11: Flexbox Layout
   * Validates that spinner uses flexbox for centering
   */
  it('should use flexbox layout for centering', () => {
    // Arrange & Act
    const { container } = render(<LoadingSpinner />);
    const wrapper = container.firstChild as HTMLElement;

    // Assert
    expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center');
  });

  /**
   * Test Case 12: Spacing Between Icon and Text
   * Validates that space-x-2 is applied when text is present
   */
  it('should have spacing between icon and text', () => {
    // Arrange & Act
    const { container } = render(<LoadingSpinner text="Loading..." />);
    const wrapper = container.firstChild as HTMLElement;

    // Assert
    expect(wrapper).toHaveClass('space-x-2');
  });
});

describe('LoadingOverlay Component', () => {
  /**
   * Test Case 1: Render Children When Not Loading
   * Validates that children are rendered normally when isLoading=false
   */
  it('should render children when not loading', () => {
    // Arrange & Act
    render(
      <LoadingOverlay isLoading={false}>
        <div data-testid="child-content">Child Content</div>
      </LoadingOverlay>
    );

    // Assert
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  /**
   * Test Case 2: No Overlay When Not Loading
   * Validates that overlay is not rendered when isLoading=false
   */
  it('should not render overlay when not loading', () => {
    // Arrange & Act
    const { container } = render(
      <LoadingOverlay isLoading={false}>
        <div>Content</div>
      </LoadingOverlay>
    );

    // Assert
    const overlay = container.querySelector('.absolute');
    expect(overlay).toBeNull();
  });

  /**
   * Test Case 3: Render Spinner When Loading
   * Validates that spinner is rendered when isLoading=true
   */
  it('should render spinner when loading', () => {
    // Arrange & Act
    const { container } = render(
      <LoadingOverlay isLoading={true}>
        <div>Content</div>
      </LoadingOverlay>
    );

    // Assert
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('animate-spin');
  });

  /**
   * Test Case 4: Render Children Behind Overlay
   * Validates that children are still rendered when loading
   */
  it('should render children behind overlay when loading', () => {
    // Arrange & Act
    render(
      <LoadingOverlay isLoading={true}>
        <div data-testid="child-content">Child Content</div>
      </LoadingOverlay>
    );

    // Assert
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  /**
   * Test Case 5: Default Loading Text
   * Validates that default "Loading..." text is displayed
   */
  it('should display default loading text', () => {
    // Arrange & Act
    render(
      <LoadingOverlay isLoading={true}>
        <div>Content</div>
      </LoadingOverlay>
    );

    // Assert
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  /**
   * Test Case 6: Custom Loading Text
   * Validates that custom text is displayed when provided
   */
  it('should display custom loading text', () => {
    // Arrange & Act
    render(
      <LoadingOverlay isLoading={true} text="Fetching data...">
        <div>Content</div>
      </LoadingOverlay>
    );

    // Assert
    expect(screen.getByText('Fetching data...')).toBeInTheDocument();
  });

  /**
   * Test Case 7: Overlay Positioning
   * Validates that overlay has correct positioning classes
   */
  it('should have correct overlay positioning', () => {
    // Arrange & Act
    const { container } = render(
      <LoadingOverlay isLoading={true}>
        <div>Content</div>
      </LoadingOverlay>
    );

    // Assert
    const overlay = container.querySelector('.absolute');
    expect(overlay).toHaveClass('absolute', 'inset-0');
  });

  /**
   * Test Case 8: Overlay Background
   * Validates that overlay has semi-transparent background
   */
  it('should have semi-transparent background', () => {
    // Arrange & Act
    const { container } = render(
      <LoadingOverlay isLoading={true}>
        <div>Content</div>
      </LoadingOverlay>
    );

    // Assert
    const overlay = container.querySelector('.absolute');
    expect(overlay).toHaveClass('bg-stone-900/80');
  });

  /**
   * Test Case 9: Overlay Centering
   * Validates that overlay content is centered
   */
  it('should center overlay content', () => {
    // Arrange & Act
    const { container } = render(
      <LoadingOverlay isLoading={true}>
        <div>Content</div>
      </LoadingOverlay>
    );

    // Assert
    const overlay = container.querySelector('.absolute');
    expect(overlay).toHaveClass('flex', 'items-center', 'justify-center');
  });

  /**
   * Test Case 10: Overlay Z-Index
   * Validates that overlay has high z-index
   */
  it('should have high z-index', () => {
    // Arrange & Act
    const { container } = render(
      <LoadingOverlay isLoading={true}>
        <div>Content</div>
      </LoadingOverlay>
    );

    // Assert
    const overlay = container.querySelector('.absolute');
    expect(overlay).toHaveClass('z-50');
  });

  /**
   * Test Case 11: Large Spinner in Overlay
   * Validates that overlay uses large spinner size
   */
  it('should use large spinner size in overlay', () => {
    // Arrange & Act
    const { container } = render(
      <LoadingOverlay isLoading={true}>
        <div>Content</div>
      </LoadingOverlay>
    );

    // Assert
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-8', 'h-8');
  });

  /**
   * Test Case 12: Relative Wrapper
   * Validates that wrapper has relative positioning
   */
  it('should have relative positioning on wrapper', () => {
    // Arrange & Act
    const { container } = render(
      <LoadingOverlay isLoading={true}>
        <div>Content</div>
      </LoadingOverlay>
    );

    // Assert
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('relative');
  });

  /**
   * Test Case 13: Toggle Loading State
   * Validates that component responds to loading state changes
   */
  it('should respond to loading state changes', () => {
    // Arrange
    const { rerender } = render(
      <LoadingOverlay isLoading={false}>
        <div data-testid="content">Content</div>
      </LoadingOverlay>
    );

    // Assert - Not loading
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();

    // Act - Change to loading
    rerender(
      <LoadingOverlay isLoading={true}>
        <div data-testid="content">Content</div>
      </LoadingOverlay>
    );

    // Assert - Now loading
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
