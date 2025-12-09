/**
 * Test Suite: Button Component
 * Purpose: Validate Button component behavior, variants, and user interactions
 * 
 * This test demonstrates:
 * 1. Component rendering with different props
 * 2. User interaction testing (clicks, hover)
 * 3. Accessibility testing
 * 4. Edge cases (disabled state, variants)
 * 
 * @see src/components/UI/Button.tsx
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { Button } from './Button';

describe('Button Component', () => {
  /**
   * Test Case 1: Basic Rendering
   * Validates that the button renders with default props
   */
  it('should render with children text', () => {
    // Arrange & Act
    render(<Button>Click me</Button>);
    
    // Assert
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
  });

  /**
   * Test Case 2: Variant Prop
   * Validates that different variants apply correct CSS classes
   */
  it('should apply primary variant by default', () => {
    // Arrange & Act
    render(<Button>Primary Button</Button>);
    
    // Assert
    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-white', 'shadow-sm');
  });

  it('should apply secondary variant classes', () => {
    // Arrange & Act
    render(<Button variant="secondary">Secondary Button</Button>);
    
    // Assert
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-stone-800', 'text-stone-200');
  });

  it('should apply ghost variant classes', () => {
    // Arrange & Act
    render(<Button variant="ghost">Ghost Button</Button>);
    
    // Assert
    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-stone-400');
  });

  /**
   * Test Case 3: Size Prop
   * Validates that size prop affects button dimensions
   */
  it('should apply medium size by default', () => {
    // Arrange & Act
    render(<Button>Medium Button</Button>);
    
    // Assert
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-4', 'py-2', 'text-sm');
  });

  it('should apply small size classes', () => {
    // Arrange & Act
    render(<Button size="sm">Small Button</Button>);
    
    // Assert
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
  });

  it('should apply large size classes', () => {
    // Arrange & Act
    render(<Button size="lg">Large Button</Button>);
    
    // Assert
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-6', 'py-3', 'text-base');
  });

  /**
   * Test Case 4: Click Handler
   * Validates that onClick callback is called when button is clicked
   */
  it('should call onClick handler when clicked', async () => {
    // Arrange
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>Clickable Button</Button>);
    
    // Act
    const button = screen.getByRole('button');
    await user.click(button);
    
    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  /**
   * Test Case 5: Disabled State
   * Validates that disabled buttons don't trigger onClick and have correct styling
   */
  it('should not call onClick when disabled', async () => {
    // Arrange
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick} disabled>Disabled Button</Button>);
    
    // Act
    const button = screen.getByRole('button');
    await user.click(button);
    
    // Assert
    expect(handleClick).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  /**
   * Test Case 6: Custom ClassName
   * Validates that custom classes are applied alongside default classes
   */
  it('should apply custom className', () => {
    // Arrange & Act
    render(<Button className="custom-class">Custom Button</Button>);
    
    // Assert
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
    // Should still have base classes
    expect(button).toHaveClass('inline-flex', 'items-center');
  });

  /**
   * Test Case 7: Primary Variant Inline Styles
   * Validates that primary variant has correct background color
   */
  it('should apply primary color inline style', () => {
    // Arrange & Act
    render(<Button variant="primary">Primary Button</Button>);
    
    // Assert
    const button = screen.getByRole('button');
    expect(button).toHaveStyle({ backgroundColor: '#D97757' });
  });

  /**
   * Test Case 8: Accessibility
   * Validates that button is keyboard accessible
   */
  it('should be keyboard accessible', async () => {
    // Arrange
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>Accessible Button</Button>);
    
    // Act - Tab to focus, then press Enter
    const button = screen.getByRole('button');
    button.focus();
    await user.keyboard('{Enter}');
    
    // Assert
    expect(handleClick).toHaveBeenCalled();
  });

  /**
   * Test Case 9: Multiple Clicks
   * Validates that button can be clicked multiple times
   */
  it('should handle multiple clicks', async () => {
    // Arrange
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>Multi-click Button</Button>);
    
    // Act
    const button = screen.getByRole('button');
    await user.click(button);
    await user.click(button);
    await user.click(button);
    
    // Assert
    expect(handleClick).toHaveBeenCalledTimes(3);
  });

  /**
   * Test Case 10: Complex Children
   * Validates that button can render complex children (not just text)
   */
  it('should render complex children', () => {
    // Arrange & Act
    render(
      <Button>
        <span>Icon</span>
        <span>Text</span>
      </Button>
    );
    
    // Assert
    const button = screen.getByRole('button');
    expect(button).toContainHTML('<span>Icon</span>');
    expect(button).toContainHTML('<span>Text</span>');
  });
});

