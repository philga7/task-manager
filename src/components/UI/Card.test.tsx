/**
 * Test Suite: Card Component
 * Purpose: Validate Card component rendering, padding variants, and hover effects
 * 
 * This test demonstrates:
 * 1. Component rendering with children
 * 2. Padding size variants (sm, md, lg)
 * 3. Hover effect behavior
 * 4. Custom className application
 * 5. Responsive design (md: breakpoints)
 * 6. Base styling (background, border, rounded corners)
 * 
 * Testing Methodology: Test-Driven Development (TDD)
 * - RED: Write failing tests first ✅
 * - GREEN: Implement minimal code to pass
 * - REFACTOR: Improve code quality
 * 
 * @see src/components/UI/Card.tsx
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Card } from './Card';

describe('Card Component', () => {
  /**
   * Test Case 1: Basic Rendering
   * Validates that the card renders children content
   */
  it('should render children content', () => {
    // Arrange & Act
    render(
      <Card>
        <h1>Card Title</h1>
        <p>Card content goes here</p>
      </Card>
    );

    // Assert
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card content goes here')).toBeInTheDocument();
  });

  /**
   * Test Case 2: Default Padding
   * Validates that medium padding is applied by default
   */
  it('should apply default medium padding', () => {
    // Arrange & Act
    const { container } = render(<Card>Default Padding</Card>);
    const card = container.firstChild as HTMLElement;

    // Assert
    expect(card).toHaveClass('p-4', 'md:p-6');
  });

  /**
   * Test Case 3: Small Padding
   * Validates that small padding variant applies correct classes
   */
  it('should apply small padding classes', () => {
    // Arrange & Act
    const { container } = render(<Card padding="sm">Small Padding</Card>);
    const card = container.firstChild as HTMLElement;

    // Assert
    expect(card).toHaveClass('p-3', 'md:p-4');
  });

  /**
   * Test Case 4: Large Padding
   * Validates that large padding variant applies correct classes
   */
  it('should apply large padding classes', () => {
    // Arrange & Act
    const { container } = render(<Card padding="lg">Large Padding</Card>);
    const card = container.firstChild as HTMLElement;

    // Assert
    expect(card).toHaveClass('p-6', 'md:p-8');
  });

  /**
   * Test Case 5: Hover Effects Enabled
   * Validates that hover classes are applied when hover=true
   */
  it('should apply hover effects when hover=true', () => {
    // Arrange & Act
    const { container } = render(<Card hover={true}>Hoverable Card</Card>);
    const card = container.firstChild as HTMLElement;

    // Assert
    expect(card).toHaveClass('hover:shadow-md', 'hover:border-stone-700', 'transition-all', 'duration-250');
  });

  /**
   * Test Case 6: Hover Effects Disabled
   * Validates that hover classes are not applied when hover=false
   */
  it('should not apply hover effects when hover=false', () => {
    // Arrange & Act
    const { container } = render(<Card hover={false}>Non-hoverable Card</Card>);
    const card = container.firstChild as HTMLElement;

    // Assert
    expect(card).not.toHaveClass('hover:shadow-md');
    expect(card).not.toHaveClass('hover:border-stone-700');
  });

  /**
   * Test Case 7: Default Hover Behavior
   * Validates that hover is false by default
   */
  it('should not apply hover effects by default', () => {
    // Arrange & Act
    const { container } = render(<Card>Default Hover</Card>);
    const card = container.firstChild as HTMLElement;

    // Assert
    expect(card).not.toHaveClass('hover:shadow-md');
  });

  /**
   * Test Case 8: Custom ClassName
   * Validates that custom classes are applied alongside default classes
   */
  it('should apply custom className', () => {
    // Arrange & Act
    const { container } = render(<Card className="custom-class">Custom Card</Card>);
    const card = container.firstChild as HTMLElement;

    // Assert
    expect(card).toHaveClass('custom-class');
    // Should still have base classes
    expect(card).toHaveClass('bg-stone-900', 'rounded-2xl', 'border');
  });

  /**
   * Test Case 9: Base Styling
   * Validates that card has correct base styling classes
   */
  it('should have correct base styling (bg, border, rounded)', () => {
    // Arrange & Act
    const { container } = render(<Card>Base Styling</Card>);
    const card = container.firstChild as HTMLElement;

    // Assert
    expect(card).toHaveClass('bg-stone-900');
    expect(card).toHaveClass('rounded-2xl');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('border-stone-800');
    expect(card).toHaveClass('shadow-sm');
  });

  /**
   * Test Case 10: Responsive Design
   * Validates that responsive classes (md:) are present
   */
  it('should be responsive with md: breakpoints', () => {
    // Arrange & Act
    const { container } = render(<Card padding="md">Responsive Card</Card>);
    const card = container.firstChild as HTMLElement;

    // Assert
    expect(card).toHaveClass('md:p-6');
  });

  /**
   * Test Case 11: Complex Children
   * Validates that card can render complex nested children
   */
  it('should render complex nested children', () => {
    // Arrange & Act
    render(
      <Card>
        <div data-testid="nested-div">
          <h2>Nested Title</h2>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      </Card>
    );

    // Assert
    expect(screen.getByTestId('nested-div')).toBeInTheDocument();
    expect(screen.getByText('Nested Title')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  /**
   * Test Case 12: Multiple Props Combination
   * Validates that multiple props work together correctly
   */
  it('should handle multiple props combination', () => {
    // Arrange & Act
    const { container } = render(
      <Card padding="lg" hover={true} className="extra-class">
        Multiple Props
      </Card>
    );
    const card = container.firstChild as HTMLElement;

    // Assert
    expect(card).toHaveClass('p-6', 'md:p-8'); // Large padding
    expect(card).toHaveClass('hover:shadow-md'); // Hover enabled
    expect(card).toHaveClass('extra-class'); // Custom class
    expect(card).toHaveClass('bg-stone-900'); // Base styling
  });

  /**
   * Test Case 13: Empty Children
   * Validates that card renders with no children
   */
  it('should render with empty children', () => {
    // Arrange & Act
    const { container } = render(<Card />);
    const card = container.firstChild as HTMLElement;

    // Assert
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('bg-stone-900');
  });
});
