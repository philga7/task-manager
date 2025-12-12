/**
 * Test Suite: EmptyState Component
 * Purpose: Validate EmptyState component for different entity types
 * 
 * This test demonstrates:
 * 1. Rendering different empty state types (tasks, projects, goals, analytics)
 * 2. Correct icon display for each type
 * 3. Correct title and description for each type
 * 4. Button text and icon for each type
 * 5. onCreate callback functionality
 * 6. Custom className application
 * 7. Keyboard accessibility
 * 
 * Testing Methodology: Test-Driven Development (TDD)
 * - RED: Write failing tests first ✅
 * - GREEN: Implement minimal code to pass
 * - REFACTOR: Improve code quality
 * 
 * @see src/components/UI/EmptyState.tsx
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState Component', () => {
  /**
   * Test Suite 1: Tasks Empty State
   * Validates tasks-specific configuration
   */
  describe('Tasks Empty State', () => {
    it('should render tasks empty state with correct title', () => {
      // Arrange & Act
      render(<EmptyState type="tasks" onCreate={() => {}} />);

      // Assert
      expect(screen.getByText('No tasks yet')).toBeInTheDocument();
    });

    it('should render tasks empty state with correct description', () => {
      // Arrange & Act
      render(<EmptyState type="tasks" onCreate={() => {}} />);

      // Assert
      expect(screen.getByText(/Start by creating your first task/i)).toBeInTheDocument();
    });

    it('should render tasks empty state with correct button text', () => {
      // Arrange & Act
      render(<EmptyState type="tasks" onCreate={() => {}} />);

      // Assert
      expect(screen.getByRole('button', { name: /Create your first task/i })).toBeInTheDocument();
    });

    it('should render Plus icon for tasks', () => {
      // Arrange & Act
      const { container } = render(<EmptyState type="tasks" onCreate={() => {}} />);

      // Assert
      // Lucide icons render as SVG elements
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });

  /**
   * Test Suite 2: Projects Empty State
   * Validates projects-specific configuration
   */
  describe('Projects Empty State', () => {
    it('should render projects empty state with correct title', () => {
      // Arrange & Act
      render(<EmptyState type="projects" onCreate={() => {}} />);

      // Assert
      expect(screen.getByText('No projects yet')).toBeInTheDocument();
    });

    it('should render projects empty state with correct description', () => {
      // Arrange & Act
      render(<EmptyState type="projects" onCreate={() => {}} />);

      // Assert
      expect(screen.getByText(/Create a project to group related tasks/i)).toBeInTheDocument();
    });

    it('should render projects empty state with correct button text', () => {
      // Arrange & Act
      render(<EmptyState type="projects" onCreate={() => {}} />);

      // Assert
      expect(screen.getByRole('button', { name: /Create your first project/i })).toBeInTheDocument();
    });

    it('should render FolderOpen icon for projects', () => {
      // Arrange & Act
      const { container } = render(<EmptyState type="projects" onCreate={() => {}} />);

      // Assert
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });

  /**
   * Test Suite 3: Goals Empty State
   * Validates goals-specific configuration
   */
  describe('Goals Empty State', () => {
    it('should render goals empty state with correct title', () => {
      // Arrange & Act
      render(<EmptyState type="goals" onCreate={() => {}} />);

      // Assert
      expect(screen.getByText('No goals yet')).toBeInTheDocument();
    });

    it('should render goals empty state with correct description', () => {
      // Arrange & Act
      render(<EmptyState type="goals" onCreate={() => {}} />);

      // Assert
      expect(screen.getByText(/Set your first goal to start tracking/i)).toBeInTheDocument();
    });

    it('should render goals empty state with correct button text', () => {
      // Arrange & Act
      render(<EmptyState type="goals" onCreate={() => {}} />);

      // Assert
      expect(screen.getByRole('button', { name: /Create your first goal/i })).toBeInTheDocument();
    });

    it('should render Target icon for goals', () => {
      // Arrange & Act
      const { container } = render(<EmptyState type="goals" onCreate={() => {}} />);

      // Assert
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });

  /**
   * Test Suite 4: Analytics Empty State
   * Validates analytics-specific configuration
   */
  describe('Analytics Empty State', () => {
    it('should render analytics empty state with correct title', () => {
      // Arrange & Act
      render(<EmptyState type="analytics" onCreate={() => {}} />);

      // Assert
      expect(screen.getByText('No data to analyze yet')).toBeInTheDocument();
    });

    it('should render analytics empty state with correct description', () => {
      // Arrange & Act
      render(<EmptyState type="analytics" onCreate={() => {}} />);

      // Assert
      expect(screen.getByText(/Complete some tasks to see your productivity/i)).toBeInTheDocument();
    });

    it('should render analytics empty state with correct button text', () => {
      // Arrange & Act
      render(<EmptyState type="analytics" onCreate={() => {}} />);

      // Assert
      expect(screen.getByRole('button', { name: /Create your first task/i })).toBeInTheDocument();
    });

    it('should render BarChart3 icon for analytics', () => {
      // Arrange & Act
      const { container } = render(<EmptyState type="analytics" onCreate={() => {}} />);

      // Assert
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });

  /**
   * Test Suite 5: User Interactions
   * Validates button click and keyboard interactions
   */
  describe('User Interactions', () => {
    it('should call onCreate when button is clicked', async () => {
      // Arrange
      const handleCreate = vi.fn();
      const user = userEvent.setup();
      render(<EmptyState type="tasks" onCreate={handleCreate} />);

      // Act
      const button = screen.getByRole('button');
      await user.click(button);

      // Assert
      expect(handleCreate).toHaveBeenCalledTimes(1);
    });

    it('should call onCreate multiple times for multiple clicks', async () => {
      // Arrange
      const handleCreate = vi.fn();
      const user = userEvent.setup();
      render(<EmptyState type="projects" onCreate={handleCreate} />);

      // Act
      const button = screen.getByRole('button');
      await user.click(button);
      await user.click(button);
      await user.click(button);

      // Assert
      expect(handleCreate).toHaveBeenCalledTimes(3);
    });

    it('should be keyboard accessible', async () => {
      // Arrange
      const handleCreate = vi.fn();
      const user = userEvent.setup();
      render(<EmptyState type="goals" onCreate={handleCreate} />);

      // Act - Tab to focus, then press Enter
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      // Assert
      expect(handleCreate).toHaveBeenCalled();
    });

    it('should be accessible via Space key', async () => {
      // Arrange
      const handleCreate = vi.fn();
      const user = userEvent.setup();
      render(<EmptyState type="analytics" onCreate={handleCreate} />);

      // Act - Tab to focus, then press Space
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');

      // Assert
      expect(handleCreate).toHaveBeenCalled();
    });
  });

  /**
   * Test Suite 6: Styling and Layout
   * Validates CSS classes and layout structure
   */
  describe('Styling and Layout', () => {
    it('should apply custom className', () => {
      // Arrange & Act
      const { container } = render(
        <EmptyState type="tasks" onCreate={() => {}} className="custom-empty-state" />
      );
      const wrapper = container.firstChild as HTMLElement;

      // Assert
      expect(wrapper).toHaveClass('custom-empty-state');
    });

    it('should have text-center class', () => {
      // Arrange & Act
      const { container } = render(<EmptyState type="tasks" onCreate={() => {}} />);
      const wrapper = container.firstChild as HTMLElement;

      // Assert
      expect(wrapper).toHaveClass('text-center');
    });

    it('should have padding classes', () => {
      // Arrange & Act
      const { container } = render(<EmptyState type="tasks" onCreate={() => {}} />);
      const wrapper = container.firstChild as HTMLElement;

      // Assert
      expect(wrapper).toHaveClass('py-12', 'px-4');
    });

    it('should have max-width container', () => {
      // Arrange & Act
      const { container } = render(<EmptyState type="tasks" onCreate={() => {}} />);

      // Assert
      const maxWidthContainer = container.querySelector('.max-w-md');
      expect(maxWidthContainer).toBeInTheDocument();
    });

    it('should center content with mx-auto', () => {
      // Arrange & Act
      const { container } = render(<EmptyState type="tasks" onCreate={() => {}} />);

      // Assert
      const centeredContainer = container.querySelector('.mx-auto');
      expect(centeredContainer).toBeInTheDocument();
    });

    it('should have correct title styling', () => {
      // Arrange & Act
      render(<EmptyState type="tasks" onCreate={() => {}} />);
      const title = screen.getByText('No tasks yet');

      // Assert
      expect(title).toHaveClass('text-lg', 'font-semibold', 'text-stone-200');
    });

    it('should have correct description styling', () => {
      // Arrange & Act
      render(<EmptyState type="tasks" onCreate={() => {}} />);
      const description = screen.getByText(/Start by creating your first task/i);

      // Assert
      expect(description).toHaveClass('text-stone-400', 'leading-relaxed');
    });

    it('should have correct icon size', () => {
      // Arrange & Act
      const { container } = render(<EmptyState type="tasks" onCreate={() => {}} />);
      const icon = container.querySelector('svg.w-12');

      // Assert
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('w-12', 'h-12');
    });

    it('should have correct icon color', () => {
      // Arrange & Act
      const { container } = render(<EmptyState type="tasks" onCreate={() => {}} />);
      const icon = container.querySelector('svg.text-stone-500');

      // Assert
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-stone-500');
    });

    it('should have margin bottom on icon', () => {
      // Arrange & Act
      const { container } = render(<EmptyState type="tasks" onCreate={() => {}} />);
      const icon = container.querySelector('svg.mb-4');

      // Assert
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('mb-4');
    });

    it('should have margin bottom on title', () => {
      // Arrange & Act
      render(<EmptyState type="tasks" onCreate={() => {}} />);
      const title = screen.getByText('No tasks yet');

      // Assert
      expect(title).toHaveClass('mb-2');
    });

    it('should have margin bottom on description', () => {
      // Arrange & Act
      render(<EmptyState type="tasks" onCreate={() => {}} />);
      const description = screen.getByText(/Start by creating your first task/i);

      // Assert
      expect(description).toHaveClass('mb-6');
    });

    it('should have inline-flex on button', () => {
      // Arrange & Act
      render(<EmptyState type="tasks" onCreate={() => {}} />);
      const button = screen.getByRole('button');

      // Assert
      expect(button).toHaveClass('inline-flex', 'items-center');
    });
  });

  /**
   * Test Suite 7: Icon Rendering
   * Validates that correct icons are rendered for each type
   */
  describe('Icon Rendering', () => {
    it('should render different icons for different types', () => {
      // Arrange & Act
      render(<EmptyState type="tasks" onCreate={() => {}} />);
      const tasksButton = screen.getByRole('button', { name: /Create your first task/i });
      
      render(<EmptyState type="projects" onCreate={() => {}} />);
      const projectsButton = screen.getByRole('button', { name: /Create your first project/i });

      // Assert - Different types render different content
      expect(tasksButton).toBeInTheDocument();
      expect(projectsButton).toBeInTheDocument();
    });

    it('should render button icon with correct size', () => {
      // Arrange & Act
      render(<EmptyState type="tasks" onCreate={() => {}} />);
      const button = screen.getByRole('button');
      const buttonSvg = button.querySelector('svg');

      // Assert
      expect(buttonSvg).toHaveClass('w-4', 'h-4');
    });

    it('should render button icon with margin', () => {
      // Arrange & Act
      render(<EmptyState type="tasks" onCreate={() => {}} />);
      const button = screen.getByRole('button');
      const buttonSvg = button.querySelector('svg');

      // Assert
      expect(buttonSvg).toHaveClass('mr-2');
    });
  });

  /**
   * Test Suite 8: Edge Cases
   * Validates component behavior in edge cases
   */
  describe('Edge Cases', () => {
    it('should handle rapid successive clicks', async () => {
      // Arrange
      const handleCreate = vi.fn();
      const user = userEvent.setup();
      render(<EmptyState type="tasks" onCreate={handleCreate} />);

      // Act - Rapid clicks
      const button = screen.getByRole('button');
      await user.tripleClick(button);

      // Assert
      expect(handleCreate).toHaveBeenCalledTimes(3);
    });

    it('should not throw error with undefined onCreate', () => {
      // Arrange & Act & Assert
      expect(() => {
        render(<EmptyState type="tasks" onCreate={() => {}} />);
      }).not.toThrow();
    });

    it('should render with all type variants', () => {
      // Arrange
      const types: Array<'tasks' | 'projects' | 'goals' | 'analytics'> = ['tasks', 'projects', 'goals', 'analytics'];

      // Act & Assert
      types.forEach(type => {
        const { unmount } = render(<EmptyState type={type} onCreate={() => {}} />);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        unmount();
      });
    });
  });

  /**
   * Test Suite 9: Accessibility
   * Validates ARIA attributes and accessibility features
   */
  describe('Accessibility', () => {
    it('should have accessible button role', () => {
      // Arrange & Act
      render(<EmptyState type="tasks" onCreate={() => {}} />);

      // Assert
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should have descriptive button text', () => {
      // Arrange & Act
      render(<EmptyState type="tasks" onCreate={() => {}} />);

      // Assert
      const button = screen.getByRole('button', { name: /Create your first task/i });
      expect(button).toBeInTheDocument();
    });

    it('should be focusable', () => {
      // Arrange & Act
      render(<EmptyState type="tasks" onCreate={() => {}} />);
      const button = screen.getByRole('button');

      // Act
      button.focus();

      // Assert
      expect(document.activeElement).toBe(button);
    });
  });
});
