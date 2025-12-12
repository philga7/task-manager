/**
 * Test Suite: RegisterForm Component
 * Purpose: Validate registration form behavior, validation, password strength, and user interactions
 * 
 * This test suite validates:
 * 1. Basic form rendering (heading, inputs, buttons)
 * 2. Form validation (name, email, password, confirm password)
 * 3. Password strength indicator
 * 4. Password visibility toggles
 * 5. Password match indicator
 * 6. Loading state behavior
 * 7. Error display from parent
 * 8. User interactions (close, switch to login)
 * 9. Accessibility features
 * 
 * Testing Methodology: Test-Driven Development (TDD)
 * - RED: Write failing tests first
 * - GREEN: Verify implementation passes
 * - REFACTOR: Improve code quality
 * 
 * @see src/components/Auth/RegisterForm.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { RegisterForm } from './RegisterForm';

/**
 * Mock props factory
 * Creates default props for RegisterForm with optional overrides
 */
const createMockProps = (overrides = {}) => ({
  onClose: vi.fn(),
  onSwitchToLogin: vi.fn(),
  onSubmit: vi.fn(),
  isLoading: false,
  error: undefined as string | undefined,
  ...overrides,
});

describe('RegisterForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test Suite 1: Basic Rendering
   * Tests that all essential form elements are present
   */
  describe('Basic Rendering', () => {
    it('should render Create Account heading', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps()} />);

      // Assert
      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    });

    it('should render name input field', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps()} />);

      // Assert
      expect(screen.getByPlaceholderText(/enter your full name/i)).toBeInTheDocument();
    });

    it('should render email input field', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps()} />);

      // Assert
      expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    });

    it('should render password input field', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps()} />);

      // Assert
      expect(screen.getByPlaceholderText(/create a password/i)).toBeInTheDocument();
    });

    it('should render confirm password input field', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps()} />);

      // Assert
      expect(screen.getByPlaceholderText(/confirm your password/i)).toBeInTheDocument();
    });

    it('should render Create Account submit button', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps()} />);

      // Assert
      expect(screen.getByRole('button', { name: /^create account$/i })).toBeInTheDocument();
    });

    it('should render Cancel button', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps()} />);

      // Assert
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should render Sign in link for switching to login', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps()} />);

      // Assert
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render labels for all input fields', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps()} />);

      // Assert
      expect(screen.getByText(/full name/i)).toBeInTheDocument();
      expect(screen.getByText(/email address/i)).toBeInTheDocument();
      expect(screen.getAllByText(/password/i).length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText(/confirm password/i)).toBeInTheDocument();
    });
  });

  /**
   * Test Suite 2: Form Validation
   * Tests name, email, password, and confirm password validation
   */
  describe('Form Validation', () => {
    it('should have required attribute on name input', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps()} />);

      // Assert
      expect(screen.getByPlaceholderText(/enter your full name/i)).toHaveAttribute('required');
    });

    it('should show error when name is less than 2 characters', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProps = createMockProps();
      render(<RegisterForm {...mockProps} />);

      // Act
      await user.type(screen.getByPlaceholderText(/enter your full name/i), 'A');
      await user.type(screen.getByPlaceholderText(/enter your email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/create a password/i), 'password123');
      await user.type(screen.getByPlaceholderText(/confirm your password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /^create account$/i }));

      // Assert
      expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument();
      expect(mockProps.onSubmit).not.toHaveBeenCalled();
    });

    it('should show error for invalid email format', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProps = createMockProps();
      render(<RegisterForm {...mockProps} />);

      // Act - Use email that passes browser validation but fails custom regex
      await user.type(screen.getByPlaceholderText(/enter your full name/i), 'John Doe');
      await user.type(screen.getByPlaceholderText(/enter your email/i), 'test@test');
      await user.type(screen.getByPlaceholderText(/create a password/i), 'password123');
      await user.type(screen.getByPlaceholderText(/confirm your password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /^create account$/i }));

      // Assert
      expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
      expect(mockProps.onSubmit).not.toHaveBeenCalled();
    });

    it('should show error when password is less than 6 characters', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProps = createMockProps();
      render(<RegisterForm {...mockProps} />);

      // Act
      await user.type(screen.getByPlaceholderText(/enter your full name/i), 'John Doe');
      await user.type(screen.getByPlaceholderText(/enter your email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/create a password/i), '12345');
      await user.type(screen.getByPlaceholderText(/confirm your password/i), '12345');
      await user.click(screen.getByRole('button', { name: /^create account$/i }));

      // Assert
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
      expect(mockProps.onSubmit).not.toHaveBeenCalled();
    });

    it('should show error when passwords do not match', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProps = createMockProps();
      render(<RegisterForm {...mockProps} />);

      // Act
      await user.type(screen.getByPlaceholderText(/enter your full name/i), 'John Doe');
      await user.type(screen.getByPlaceholderText(/enter your email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/create a password/i), 'password123');
      await user.type(screen.getByPlaceholderText(/confirm your password/i), 'different123');
      await user.click(screen.getByRole('button', { name: /^create account$/i }));

      // Assert
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      expect(mockProps.onSubmit).not.toHaveBeenCalled();
    });

    it('should clear validation error when user types in that field', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<RegisterForm {...createMockProps()} />);

      // Act - Trigger name validation error
      await user.type(screen.getByPlaceholderText(/enter your full name/i), 'A');
      await user.type(screen.getByPlaceholderText(/enter your email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/create a password/i), 'password123');
      await user.type(screen.getByPlaceholderText(/confirm your password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /^create account$/i }));
      
      // Verify error is shown
      expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument();

      // Type more in name field
      await user.type(screen.getByPlaceholderText(/enter your full name/i), 'B');

      // Assert - Error should be cleared
      expect(screen.queryByText(/at least 2 characters/i)).not.toBeInTheDocument();
    });
  });

  /**
   * Test Suite 3: Password Strength Indicator
   * Tests the password strength meter and feedback
   */
  describe('Password Strength Indicator', () => {
    it('should not show strength indicator when password is empty', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps()} />);

      // Assert
      expect(screen.queryByText(/password strength/i)).not.toBeInTheDocument();
    });

    it('should show "Weak" for simple password', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<RegisterForm {...createMockProps()} />);

      // Act - Type a weak password (short, no variety)
      await user.type(screen.getByPlaceholderText(/create a password/i), 'abc');

      // Assert
      expect(screen.getByText(/weak/i)).toBeInTheDocument();
    });

    it('should show "Fair" for password with some complexity', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<RegisterForm {...createMockProps()} />);

      // Act - Password with length + lowercase + uppercase (3 requirements)
      await user.type(screen.getByPlaceholderText(/create a password/i), 'Abcdefgh');

      // Assert
      expect(screen.getByText(/fair/i)).toBeInTheDocument();
    });

    it('should show "Good" for password with good complexity', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<RegisterForm {...createMockProps()} />);

      // Act - Password with length + lowercase + uppercase + number (4 requirements)
      await user.type(screen.getByPlaceholderText(/create a password/i), 'Abcdefg1');

      // Assert
      expect(screen.getByText(/good/i)).toBeInTheDocument();
    });

    it('should show "Strong" for password meeting all requirements', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<RegisterForm {...createMockProps()} />);

      // Act - Password with all requirements: length + lower + upper + number + special
      await user.type(screen.getByPlaceholderText(/create a password/i), 'Abcdefg1!');

      // Assert
      expect(screen.getByText(/strong/i)).toBeInTheDocument();
    });

    it('should show feedback for missing requirements', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<RegisterForm {...createMockProps()} />);

      // Act - Type password missing some requirements
      await user.type(screen.getByPlaceholderText(/create a password/i), 'abc');

      // Assert - Should show what's missing
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/at least one uppercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/at least one number/i)).toBeInTheDocument();
      expect(screen.getByText(/at least one special character/i)).toBeInTheDocument();
    });

    it('should hide requirement feedback as they are met', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<RegisterForm {...createMockProps()} />);

      // Act - Type password with uppercase
      await user.type(screen.getByPlaceholderText(/create a password/i), 'Abc');

      // Assert - Uppercase requirement should not show
      expect(screen.queryByText(/at least one uppercase letter/i)).not.toBeInTheDocument();
      // But others should still show
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });

    it('should update progress bar width based on strength', async () => {
      // Arrange
      const user = userEvent.setup();
      const { container } = render(<RegisterForm {...createMockProps()} />);

      // Act - Type password
      await user.type(screen.getByPlaceholderText(/create a password/i), 'ab');

      // Assert - Progress bar should exist and have some width
      const progressBar = container.querySelector('.rounded-full.transition-all');
      expect(progressBar).toBeInTheDocument();
    });
  });

  /**
   * Test Suite 4: Password Visibility Toggle
   * Tests show/hide password functionality for both fields
   */
  describe('Password Visibility Toggle', () => {
    it('should hide password by default', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps()} />);

      // Assert
      expect(screen.getByPlaceholderText(/create a password/i)).toHaveAttribute('type', 'password');
    });

    it('should hide confirm password by default', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps()} />);

      // Assert
      expect(screen.getByPlaceholderText(/confirm your password/i)).toHaveAttribute('type', 'password');
    });

    it('should toggle password visibility on click', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<RegisterForm {...createMockProps()} />);

      const passwordInput = screen.getByPlaceholderText(/create a password/i);
      const passwordContainer = passwordInput.parentElement;
      const toggleButton = passwordContainer?.querySelector('button');

      // Act
      await user.click(toggleButton!);

      // Assert
      expect(passwordInput).toHaveAttribute('type', 'text');
    });

    it('should toggle confirm password visibility on click', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<RegisterForm {...createMockProps()} />);

      const confirmInput = screen.getByPlaceholderText(/confirm your password/i);
      const confirmContainer = confirmInput.parentElement;
      const toggleButton = confirmContainer?.querySelector('button');

      // Act
      await user.click(toggleButton!);

      // Assert
      expect(confirmInput).toHaveAttribute('type', 'text');
    });

    it('should hide password again when toggled twice', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<RegisterForm {...createMockProps()} />);

      const passwordInput = screen.getByPlaceholderText(/create a password/i);
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
   * Test Suite 5: Password Match Indicator
   * Tests the password match feedback
   */
  describe('Password Match Indicator', () => {
    it('should not show match indicator when confirm password is empty', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<RegisterForm {...createMockProps()} />);

      // Act
      await user.type(screen.getByPlaceholderText(/create a password/i), 'password123');

      // Assert
      expect(screen.queryByText(/passwords match/i)).not.toBeInTheDocument();
    });

    it('should show "Passwords match" when passwords match', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<RegisterForm {...createMockProps()} />);

      // Act
      await user.type(screen.getByPlaceholderText(/create a password/i), 'password123');
      await user.type(screen.getByPlaceholderText(/confirm your password/i), 'password123');

      // Assert
      expect(screen.getByText(/passwords match/i)).toBeInTheDocument();
    });

    it('should not show match indicator when passwords differ', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<RegisterForm {...createMockProps()} />);

      // Act
      await user.type(screen.getByPlaceholderText(/create a password/i), 'password123');
      await user.type(screen.getByPlaceholderText(/confirm your password/i), 'different');

      // Assert
      expect(screen.queryByText(/passwords match/i)).not.toBeInTheDocument();
    });
  });

  /**
   * Test Suite 6: Form Submission
   * Tests form submission with valid data
   */
  describe('Form Submission', () => {
    it('should call onSubmit with name, email, and password when form is valid', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProps = createMockProps();
      render(<RegisterForm {...mockProps} />);

      // Act
      await user.type(screen.getByPlaceholderText(/enter your full name/i), 'John Doe');
      await user.type(screen.getByPlaceholderText(/enter your email/i), 'john@example.com');
      await user.type(screen.getByPlaceholderText(/create a password/i), 'password123');
      await user.type(screen.getByPlaceholderText(/confirm your password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /^create account$/i }));

      // Assert
      expect(mockProps.onSubmit).toHaveBeenCalledTimes(1);
      expect(mockProps.onSubmit).toHaveBeenCalledWith('John Doe', 'john@example.com', 'password123');
    });

    it('should not call onSubmit when validation fails', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProps = createMockProps();
      render(<RegisterForm {...mockProps} />);

      // Act - Submit with mismatched passwords
      await user.type(screen.getByPlaceholderText(/enter your full name/i), 'John Doe');
      await user.type(screen.getByPlaceholderText(/enter your email/i), 'john@example.com');
      await user.type(screen.getByPlaceholderText(/create a password/i), 'password123');
      await user.type(screen.getByPlaceholderText(/confirm your password/i), 'different');
      await user.click(screen.getByRole('button', { name: /^create account$/i }));

      // Assert
      expect(mockProps.onSubmit).not.toHaveBeenCalled();
    });
  });

  /**
   * Test Suite 7: Loading State
   * Tests form behavior when isLoading is true
   */
  describe('Loading State', () => {
    it('should disable name input when loading', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps({ isLoading: true })} />);

      // Assert
      expect(screen.getByPlaceholderText(/enter your full name/i)).toBeDisabled();
    });

    it('should disable email input when loading', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps({ isLoading: true })} />);

      // Assert
      expect(screen.getByPlaceholderText(/enter your email/i)).toBeDisabled();
    });

    it('should disable password input when loading', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps({ isLoading: true })} />);

      // Assert
      expect(screen.getByPlaceholderText(/create a password/i)).toBeDisabled();
    });

    it('should disable confirm password input when loading', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps({ isLoading: true })} />);

      // Assert
      expect(screen.getByPlaceholderText(/confirm your password/i)).toBeDisabled();
    });

    it('should show "Creating Account..." on submit button when loading', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps({ isLoading: true })} />);

      // Assert
      expect(screen.getByRole('button', { name: /creating account/i })).toBeInTheDocument();
    });

    it('should disable submit button when loading', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps({ isLoading: true })} />);

      // Assert
      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
    });

    it('should disable Cancel button when loading', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps({ isLoading: true })} />);

      // Assert
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });

    it('should disable Sign in link when loading', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps({ isLoading: true })} />);

      // Assert
      expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
    });

    it('should disable password visibility toggle when loading', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps({ isLoading: true })} />);

      const passwordInput = screen.getByPlaceholderText(/create a password/i);
      const passwordContainer = passwordInput.parentElement;
      const toggleButton = passwordContainer?.querySelector('button');

      // Assert
      expect(toggleButton).toBeDisabled();
    });
  });

  /**
   * Test Suite 8: Error Display
   * Tests display of authentication errors from parent
   */
  describe('Error Display', () => {
    it('should display authentication error when error prop is provided', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps({ error: 'Email already exists' })} />);

      // Assert
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });

    it('should have role="alert" on error message', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps({ error: 'Email already exists' })} />);

      // Assert
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have aria-live="polite" on error message', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps({ error: 'Email already exists' })} />);

      // Assert
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveAttribute('aria-live', 'polite');
    });

    it('should not display error container when no error', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps()} />);

      // Assert
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  /**
   * Test Suite 9: User Interactions
   * Tests button clicks and navigation callbacks
   */
  describe('User Interactions', () => {
    it('should call onClose when X button is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProps = createMockProps();
      const { container } = render(<RegisterForm {...mockProps} />);

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
      render(<RegisterForm {...mockProps} />);

      // Act
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Assert
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onSwitchToLogin when Sign in is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProps = createMockProps();
      render(<RegisterForm {...mockProps} />);

      // Act
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Assert
      expect(mockProps.onSwitchToLogin).toHaveBeenCalledTimes(1);
    });

    it('should update input values when typing', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<RegisterForm {...createMockProps()} />);

      // Act & Assert - Name
      const nameInput = screen.getByPlaceholderText(/enter your full name/i);
      await user.type(nameInput, 'John Doe');
      expect(nameInput).toHaveValue('John Doe');

      // Act & Assert - Email
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      await user.type(emailInput, 'john@example.com');
      expect(emailInput).toHaveValue('john@example.com');

      // Act & Assert - Password
      const passwordInput = screen.getByPlaceholderText(/create a password/i);
      await user.type(passwordInput, 'password123');
      expect(passwordInput).toHaveValue('password123');

      // Act & Assert - Confirm Password
      const confirmInput = screen.getByPlaceholderText(/confirm your password/i);
      await user.type(confirmInput, 'password123');
      expect(confirmInput).toHaveValue('password123');
    });
  });

  /**
   * Test Suite 10: Accessibility
   * Tests accessibility compliance
   */
  describe('Accessibility', () => {
    it('should have required attribute on all required inputs', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps()} />);

      // Assert
      expect(screen.getByPlaceholderText(/enter your full name/i)).toHaveAttribute('required');
      expect(screen.getByPlaceholderText(/enter your email/i)).toHaveAttribute('required');
      expect(screen.getByPlaceholderText(/create a password/i)).toHaveAttribute('required');
      expect(screen.getByPlaceholderText(/confirm your password/i)).toHaveAttribute('required');
    });

    it('should have proper input types', () => {
      // Arrange & Act
      render(<RegisterForm {...createMockProps()} />);

      // Assert
      expect(screen.getByPlaceholderText(/enter your full name/i)).toHaveAttribute('type', 'text');
      expect(screen.getByPlaceholderText(/enter your email/i)).toHaveAttribute('type', 'email');
      expect(screen.getByPlaceholderText(/create a password/i)).toHaveAttribute('type', 'password');
      expect(screen.getByPlaceholderText(/confirm your password/i)).toHaveAttribute('type', 'password');
    });

    it('should be keyboard navigable', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<RegisterForm {...createMockProps()} />);

      // Act - Focus first input and tab through
      const nameInput = screen.getByPlaceholderText(/enter your full name/i);
      nameInput.focus();

      // Assert
      expect(nameInput).toHaveFocus();

      // Tab to email
      await user.tab();
      expect(screen.getByPlaceholderText(/enter your email/i)).toHaveFocus();
    });
  });

  /**
   * Test Suite 11: Edge Cases
   * Tests unusual inputs and boundary conditions
   */
  describe('Edge Cases', () => {
    it('should accept exactly 2 character name (boundary)', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProps = createMockProps();
      render(<RegisterForm {...mockProps} />);

      // Act
      await user.type(screen.getByPlaceholderText(/enter your full name/i), 'AB');
      await user.type(screen.getByPlaceholderText(/enter your email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/create a password/i), 'password123');
      await user.type(screen.getByPlaceholderText(/confirm your password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /^create account$/i }));

      // Assert - Should pass validation
      expect(mockProps.onSubmit).toHaveBeenCalledWith('AB', 'test@example.com', 'password123');
    });

    it('should accept exactly 6 character password (boundary)', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProps = createMockProps();
      render(<RegisterForm {...mockProps} />);

      // Act
      await user.type(screen.getByPlaceholderText(/enter your full name/i), 'John');
      await user.type(screen.getByPlaceholderText(/enter your email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/create a password/i), '123456');
      await user.type(screen.getByPlaceholderText(/confirm your password/i), '123456');
      await user.click(screen.getByRole('button', { name: /^create account$/i }));

      // Assert - Should pass validation
      expect(mockProps.onSubmit).toHaveBeenCalledWith('John', 'test@example.com', '123456');
    });

    it('should handle special characters in password', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProps = createMockProps();
      render(<RegisterForm {...mockProps} />);

      // Act
      await user.type(screen.getByPlaceholderText(/enter your full name/i), 'John');
      await user.type(screen.getByPlaceholderText(/enter your email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/create a password/i), 'P@$$w0rd!#%');
      await user.type(screen.getByPlaceholderText(/confirm your password/i), 'P@$$w0rd!#%');
      await user.click(screen.getByRole('button', { name: /^create account$/i }));

      // Assert
      expect(mockProps.onSubmit).toHaveBeenCalledWith('John', 'test@example.com', 'P@$$w0rd!#%');
    });

    it('should handle unicode characters in name', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProps = createMockProps();
      render(<RegisterForm {...mockProps} />);

      // Act
      await user.type(screen.getByPlaceholderText(/enter your full name/i), '中文名字');
      await user.type(screen.getByPlaceholderText(/enter your email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/create a password/i), 'password123');
      await user.type(screen.getByPlaceholderText(/confirm your password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /^create account$/i }));

      // Assert
      expect(mockProps.onSubmit).toHaveBeenCalledWith('中文名字', 'test@example.com', 'password123');
    });
  });
});
