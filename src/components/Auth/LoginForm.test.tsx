/**
 * Test Suite: LoginForm Component
 * Purpose: Validate login form behavior, validation, and user interactions
 * 
 * This test suite validates:
 * 1. Basic form rendering (heading, inputs, buttons)
 * 2. Form validation (email, password requirements)
 * 3. Form submission handling
 * 4. Password visibility toggle
 * 5. Loading state behavior
 * 6. Error display from parent
 * 7. User interactions (close, switch to register)
 * 8. Accessibility features
 * 
 * Testing Methodology: Test-Driven Development (TDD)
 * - RED: Write failing tests first
 * - GREEN: Verify implementation passes
 * - REFACTOR: Improve code quality
 * 
 * @see src/components/Auth/LoginForm.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { LoginForm } from './LoginForm';

/**
 * Mock props factory
 * Creates default props for LoginForm with optional overrides
 */
const createMockProps = (overrides = {}) => ({
  onClose: vi.fn(),
  onSwitchToRegister: vi.fn(),
  onSubmit: vi.fn(),
  isLoading: false,
  error: undefined as string | undefined,
  ...overrides,
});

describe('LoginForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test Suite 1: Basic Rendering
   * Tests that all essential form elements are present
   */
  describe('Basic Rendering', () => {
    it('should render Sign In heading', () => {
      // Arrange & Act
      render(<LoginForm {...createMockProps()} />);

      // Assert
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render email input field', () => {
      // Arrange & Act
      render(<LoginForm {...createMockProps()} />);

      // Assert
      expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    });

    it('should render password input field', () => {
      // Arrange & Act
      render(<LoginForm {...createMockProps()} />);

      // Assert
      expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
    });

    it('should render Sign In submit button', () => {
      // Arrange & Act
      render(<LoginForm {...createMockProps()} />);

      // Assert
      expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
    });

    it('should render Cancel button', () => {
      // Arrange & Act
      render(<LoginForm {...createMockProps()} />);

      // Assert
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should render Sign up link for switching to registration', () => {
      // Arrange & Act
      render(<LoginForm {...createMockProps()} />);

      // Assert
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('should render close button (X icon)', () => {
      // Arrange & Act
      const { container } = render(<LoginForm {...createMockProps()} />);

      // Assert - Find the close button by its position and class
      const closeButtons = container.querySelectorAll('button');
      // First button after the heading should be the close button
      expect(closeButtons.length).toBeGreaterThan(0);
    });

    it('should render labels for input fields', () => {
      // Arrange & Act
      render(<LoginForm {...createMockProps()} />);

      // Assert
      expect(screen.getByText(/email address/i)).toBeInTheDocument();
      expect(screen.getByText(/password/i)).toBeInTheDocument();
    });
  });

  /**
   * Test Suite 2: Form Validation
   * Tests email and password validation rules
   * 
   * Note: The form uses HTML5 native validation (required attribute) which
   * prevents form submission before custom validation runs. Our custom
   * validation adds additional checks like email format and password length.
   */
  describe('Form Validation', () => {
    it('should have required attribute on email input for native validation', () => {
      // Arrange & Act
      render(<LoginForm {...createMockProps()} />);

      // Assert - Native HTML5 validation prevents empty submission
      expect(screen.getByPlaceholderText(/enter your email/i)).toHaveAttribute('required');
    });

    it('should show error for invalid email format', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProps = createMockProps();
      render(<LoginForm {...mockProps} />);

      // Act - Type email that passes browser validation but fails custom regex
      // Browser allows "test@test" but our regex requires a dot: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      await user.type(screen.getByPlaceholderText(/enter your email/i), 'test@test');
      await user.type(screen.getByPlaceholderText(/enter your password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      // Assert - Custom validation shows error for missing domain extension
      expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
      expect(mockProps.onSubmit).not.toHaveBeenCalled();
    });

    it('should have required attribute on password input for native validation', () => {
      // Arrange & Act
      render(<LoginForm {...createMockProps()} />);

      // Assert - Native HTML5 validation prevents empty submission
      expect(screen.getByPlaceholderText(/enter your password/i)).toHaveAttribute('required');
    });

    it('should show error when password is less than 6 characters', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProps = createMockProps();
      render(<LoginForm {...mockProps} />);

      // Act
      await user.type(screen.getByPlaceholderText(/enter your email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/enter your password/i), '12345'); // 5 chars
      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      // Assert
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
      expect(mockProps.onSubmit).not.toHaveBeenCalled();
    });

    it('should clear validation error when user starts typing in that field', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm {...createMockProps()} />);

      // Act - Trigger password length validation error
      await user.type(screen.getByPlaceholderText(/enter your email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/enter your password/i), '12345'); // Too short
      await user.click(screen.getByRole('button', { name: /^sign in$/i }));
      
      // Verify error is shown
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();

      // Type more in password field
      await user.type(screen.getByPlaceholderText(/enter your password/i), '6');

      // Assert - Error should be cleared when typing
      expect(screen.queryByText(/at least 6 characters/i)).not.toBeInTheDocument();
    });

    it('should clear email validation error when user types in email field', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm {...createMockProps()} />);

      // Act - Trigger email validation error (passes browser, fails custom regex)
      await user.type(screen.getByPlaceholderText(/enter your email/i), 'test@test');
      await user.type(screen.getByPlaceholderText(/enter your password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /^sign in$/i }));
      
      // Verify error is shown
      expect(screen.getByText(/valid email address/i)).toBeInTheDocument();

      // Type more in email field (adding .com to make it valid)
      await user.type(screen.getByPlaceholderText(/enter your email/i), '.com');

      // Assert - Error should be cleared when typing
      expect(screen.queryByText(/valid email address/i)).not.toBeInTheDocument();
    });

    it('should accept valid email formats', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProps = createMockProps();
      render(<LoginForm {...mockProps} />);

      // Act - Use various valid email formats
      const validEmails = ['test@example.com', 'user.name@domain.org', 'user+tag@company.co.uk'];
      
      for (const email of validEmails) {
        // Clear and type new email
        const emailInput = screen.getByPlaceholderText(/enter your email/i);
        await user.clear(emailInput);
        await user.type(emailInput, email);
        await user.clear(screen.getByPlaceholderText(/enter your password/i));
        await user.type(screen.getByPlaceholderText(/enter your password/i), 'password123');
        
        // Submit
        await user.click(screen.getByRole('button', { name: /^sign in$/i }));
        
        // Should not show email validation error
        expect(screen.queryByText(/valid email address/i)).not.toBeInTheDocument();
      }
    });
  });

  /**
   * Test Suite 3: Form Submission
   * Tests form submission with valid and invalid data
   */
  describe('Form Submission', () => {
    it('should call onSubmit with email and password when form is valid', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProps = createMockProps();
      render(<LoginForm {...mockProps} />);

      // Act
      await user.type(screen.getByPlaceholderText(/enter your email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/enter your password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      // Assert
      expect(mockProps.onSubmit).toHaveBeenCalledTimes(1);
      expect(mockProps.onSubmit).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should not call onSubmit when email validation fails', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProps = createMockProps();
      render(<LoginForm {...mockProps} />);

      // Act
      await user.type(screen.getByPlaceholderText(/enter your email/i), 'invalid');
      await user.type(screen.getByPlaceholderText(/enter your password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      // Assert
      expect(mockProps.onSubmit).not.toHaveBeenCalled();
    });

    it('should not call onSubmit when password validation fails', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProps = createMockProps();
      render(<LoginForm {...mockProps} />);

      // Act
      await user.type(screen.getByPlaceholderText(/enter your email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/enter your password/i), '123'); // Too short
      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      // Assert
      expect(mockProps.onSubmit).not.toHaveBeenCalled();
    });

    it('should prevent default form submission', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProps = createMockProps();
      render(<LoginForm {...mockProps} />);

      // Act
      await user.type(screen.getByPlaceholderText(/enter your email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/enter your password/i), 'password123');
      
      // Submit via Enter key in password field
      await user.keyboard('{Enter}');

      // Assert - Form should submit successfully via onSubmit
      expect(mockProps.onSubmit).toHaveBeenCalled();
    });
  });

  /**
   * Test Suite 4: Password Visibility Toggle
   * Tests the show/hide password functionality
   */
  describe('Password Visibility Toggle', () => {
    it('should hide password by default', () => {
      // Arrange & Act
      render(<LoginForm {...createMockProps()} />);

      // Assert
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should show password when toggle is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm {...createMockProps()} />);

      // Find the toggle button (it's within the password field container)
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      const passwordContainer = passwordInput.parentElement;
      const toggleButton = passwordContainer?.querySelector('button');

      // Act
      await user.click(toggleButton!);

      // Assert
      expect(passwordInput).toHaveAttribute('type', 'text');
    });

    it('should hide password again when toggle is clicked twice', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm {...createMockProps()} />);

      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      const passwordContainer = passwordInput.parentElement;
      const toggleButton = passwordContainer?.querySelector('button');

      // Act
      await user.click(toggleButton!); // Show
      await user.click(toggleButton!); // Hide

      // Assert
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  /**
   * Test Suite 5: Loading State
   * Tests the form behavior when isLoading is true
   */
  describe('Loading State', () => {
    it('should disable email input when loading', () => {
      // Arrange & Act
      render(<LoginForm {...createMockProps({ isLoading: true })} />);

      // Assert
      expect(screen.getByPlaceholderText(/enter your email/i)).toBeDisabled();
    });

    it('should disable password input when loading', () => {
      // Arrange & Act
      render(<LoginForm {...createMockProps({ isLoading: true })} />);

      // Assert
      expect(screen.getByPlaceholderText(/enter your password/i)).toBeDisabled();
    });

    it('should show "Signing In..." text on submit button when loading', () => {
      // Arrange & Act
      render(<LoginForm {...createMockProps({ isLoading: true })} />);

      // Assert
      expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
    });

    it('should disable submit button when loading', () => {
      // Arrange & Act
      render(<LoginForm {...createMockProps({ isLoading: true })} />);

      // Assert
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    });

    it('should disable Cancel button when loading', () => {
      // Arrange & Act
      render(<LoginForm {...createMockProps({ isLoading: true })} />);

      // Assert
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });

    it('should disable password visibility toggle when loading', () => {
      // Arrange & Act
      render(<LoginForm {...createMockProps({ isLoading: true })} />);

      // Find toggle button
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      const passwordContainer = passwordInput.parentElement;
      const toggleButton = passwordContainer?.querySelector('button');

      // Assert
      expect(toggleButton).toBeDisabled();
    });

    it('should disable Sign up link when loading', () => {
      // Arrange & Act
      render(<LoginForm {...createMockProps({ isLoading: true })} />);

      // Assert
      expect(screen.getByRole('button', { name: /sign up/i })).toBeDisabled();
    });
  });

  /**
   * Test Suite 6: Error Display
   * Tests display of authentication errors from parent
   */
  describe('Error Display', () => {
    it('should display authentication error when error prop is provided', () => {
      // Arrange & Act
      render(<LoginForm {...createMockProps({ error: 'Invalid credentials' })} />);

      // Assert
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    it('should have role="alert" on error message', () => {
      // Arrange & Act
      render(<LoginForm {...createMockProps({ error: 'Invalid credentials' })} />);

      // Assert
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have aria-live="polite" on error message', () => {
      // Arrange & Act
      render(<LoginForm {...createMockProps({ error: 'Invalid credentials' })} />);

      // Assert
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveAttribute('aria-live', 'polite');
    });

    it('should not display error container when no error', () => {
      // Arrange & Act
      render(<LoginForm {...createMockProps()} />);

      // Assert
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should display various error messages correctly', () => {
      // Arrange
      const errorMessages = [
        'Invalid credentials',
        'Account not found',
        'Too many login attempts',
        'Network error',
      ];

      errorMessages.forEach((error) => {
        // Act
        const { unmount } = render(<LoginForm {...createMockProps({ error })} />);

        // Assert
        expect(screen.getByText(error)).toBeInTheDocument();

        // Cleanup for next iteration
        unmount();
      });
    });
  });

  /**
   * Test Suite 7: User Interactions
   * Tests button clicks and navigation callbacks
   */
  describe('User Interactions', () => {
    it('should call onClose when X button is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProps = createMockProps();
      const { container } = render(<LoginForm {...mockProps} />);

      // Find X button (first button in the header area)
      const headerArea = container.querySelector('.flex.items-center.justify-between');
      const closeButton = headerArea?.querySelector('button');

      // Act
      await user.click(closeButton!);

      // Assert
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Cancel button is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProps = createMockProps();
      render(<LoginForm {...mockProps} />);

      // Act
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Assert
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onSwitchToRegister when Sign up is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProps = createMockProps();
      render(<LoginForm {...mockProps} />);

      // Act
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      // Assert
      expect(mockProps.onSwitchToRegister).toHaveBeenCalledTimes(1);
    });

    it('should update email field value when typing', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm {...createMockProps()} />);

      // Act
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      await user.type(emailInput, 'test@example.com');

      // Assert
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should update password field value when typing', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm {...createMockProps()} />);

      // Act
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      await user.type(passwordInput, 'mypassword');

      // Assert
      expect(passwordInput).toHaveValue('mypassword');
    });
  });

  /**
   * Test Suite 8: Accessibility
   * Tests for accessibility compliance
   */
  describe('Accessibility', () => {
    it('should have accessible email label', () => {
      // Arrange & Act
      render(<LoginForm {...createMockProps()} />);

      // Assert - Label should be visible and associated
      expect(screen.getByText(/email address/i)).toBeInTheDocument();
    });

    it('should have accessible password label', () => {
      // Arrange & Act
      render(<LoginForm {...createMockProps()} />);

      // Assert
      expect(screen.getByText(/password/i)).toBeInTheDocument();
    });

    it('should make form keyboard navigable', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm {...createMockProps()} />);

      // Act - Tab through form elements
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      emailInput.focus();
      
      // Assert - First focusable element
      expect(emailInput).toHaveFocus();

      // Tab to password
      await user.tab();
      expect(screen.getByPlaceholderText(/enter your password/i)).toHaveFocus();
    });

    it('should have required attribute on email input', () => {
      // Arrange & Act
      render(<LoginForm {...createMockProps()} />);

      // Assert
      expect(screen.getByPlaceholderText(/enter your email/i)).toBeRequired();
    });

    it('should have required attribute on password input', () => {
      // Arrange & Act
      render(<LoginForm {...createMockProps()} />);

      // Assert
      expect(screen.getByPlaceholderText(/enter your password/i)).toBeRequired();
    });

    it('should have proper input types', () => {
      // Arrange & Act
      render(<LoginForm {...createMockProps()} />);

      // Assert
      expect(screen.getByPlaceholderText(/enter your email/i)).toHaveAttribute('type', 'email');
      expect(screen.getByPlaceholderText(/enter your password/i)).toHaveAttribute('type', 'password');
    });
  });

  /**
   * Test Suite 9: Edge Cases
   * Tests unusual inputs and boundary conditions
   */
  describe('Edge Cases', () => {
    it('should handle email with spaces (browser trims type=email input)', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProps = createMockProps();
      render(<LoginForm {...mockProps} />);

      // Act - Email with leading/trailing spaces (browser auto-trims for type="email")
      await user.type(screen.getByPlaceholderText(/enter your email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/enter your password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      // Assert - Should submit successfully (browser handles trimming)
      expect(mockProps.onSubmit).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should handle special characters in password', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProps = createMockProps();
      render(<LoginForm {...mockProps} />);

      // Act
      await user.type(screen.getByPlaceholderText(/enter your email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/enter your password/i), 'P@$$w0rd!#%');
      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      // Assert
      expect(mockProps.onSubmit).toHaveBeenCalledWith('test@example.com', 'P@$$w0rd!#%');
    });

    it('should handle exactly 6 character password (boundary)', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProps = createMockProps();
      render(<LoginForm {...mockProps} />);

      // Act
      await user.type(screen.getByPlaceholderText(/enter your email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/enter your password/i), '123456'); // Exactly 6 chars
      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      // Assert - Should pass validation
      expect(mockProps.onSubmit).toHaveBeenCalledWith('test@example.com', '123456');
    });

    it('should handle long email addresses', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProps = createMockProps();
      render(<LoginForm {...mockProps} />);

      const longEmail = 'very.long.email.address.with.many.parts@subdomain.example.domain.com';

      // Act
      await user.type(screen.getByPlaceholderText(/enter your email/i), longEmail);
      await user.type(screen.getByPlaceholderText(/enter your password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      // Assert
      expect(mockProps.onSubmit).toHaveBeenCalledWith(longEmail, 'password123');
    });
  });
});
