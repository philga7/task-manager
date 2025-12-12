/**
 * Test Suite: TaskCard Component
 * 
 * Purpose: Validate TaskCard component rendering, user interactions, and state management
 * 
 * This test suite covers:
 * 1. Basic rendering of task properties (title, description, priority, due date, tags)
 * 2. Completion status display and toggle functionality
 * 3. Priority-based color schemes
 * 4. Edit modal interaction
 * 5. Edge cases (long text, special characters, unicode)
 * 
 * Component Dependencies:
 * - AppContext (useApp hook) for dispatch
 * - TaskForm component (rendered on click)
 * - priorityColors utility for styling
 * - date-fns for date formatting
 * - lucide-react for icons
 * 
 * @see src/components/Tasks/TaskCard.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { TaskCard } from './TaskCard';
import { renderWithAppContext, createMockTask } from '../../tests/test-utils';
import { Task } from '../../types';

/**
 * Mock date-fns format function to ensure consistent date formatting in tests
 * This prevents timezone-related test flakiness
 */
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns');
  return {
    ...actual,
    format: vi.fn((date: Date, formatStr: string) => {
      // Return consistent format for testing
      if (formatStr === 'MMM d') {
        const month = date.toLocaleString('en-US', { month: 'short' });
        const day = date.getDate();
        return `${month} ${day}`;
      }
      return date.toISOString();
    })
  };
});

describe('TaskCard Component', () => {
  // Common setup
  let user: ReturnType<typeof userEvent.setup>;
  
  beforeEach(() => {
    user = userEvent.setup();
  });

  // ============================================================
  // RENDERING - BASIC
  // ============================================================
  describe('Basic Rendering', () => {
    /**
     * Test: Displays task title
     * Purpose: Verify the task title is rendered visibly
     */
    it('should display the task title', () => {
      // Arrange
      const task = createMockTask({ title: 'Complete project documentation' });
      
      // Act
      renderWithAppContext(<TaskCard task={task} />);
      
      // Assert
      expect(screen.getByText('Complete project documentation')).toBeInTheDocument();
    });

    /**
     * Test: Displays task description when provided
     * Purpose: Verify optional description is shown when present
     */
    it('should display task description when provided', () => {
      // Arrange
      const task = createMockTask({ 
        title: 'Test Task',
        description: 'This is a detailed task description' 
      });
      
      // Act
      renderWithAppContext(<TaskCard task={task} />);
      
      // Assert
      expect(screen.getByText('This is a detailed task description')).toBeInTheDocument();
    });

    /**
     * Test: Does not render description when undefined
     * Purpose: Verify component handles missing optional props gracefully
     */
    it('should not render description when undefined', () => {
      // Arrange
      const task = createMockTask({ 
        title: 'Test Task',
        description: undefined 
      });
      
      // Act
      renderWithAppContext(<TaskCard task={task} />);
      
      // Assert - description paragraph should not exist
      const titleElement = screen.getByText('Test Task');
      const cardContent = titleElement.parentElement;
      const descriptionParagraphs = cardContent?.querySelectorAll('p');
      
      // Should have no description paragraphs (or only ones that aren't task descriptions)
      expect(descriptionParagraphs?.length || 0).toBe(0);
    });
  });

  // ============================================================
  // RENDERING - PRIORITY
  // ============================================================
  describe('Priority Rendering', () => {
    /**
     * Test: Displays priority text
     * Purpose: Verify priority badge shows correct text
     */
    it('should display priority text', () => {
      // Arrange
      const task = createMockTask({ priority: 'high' });
      
      // Act
      renderWithAppContext(<TaskCard task={task} />);
      
      // Assert
      expect(screen.getByText('high')).toBeInTheDocument();
    });

    /**
     * Test: Applies correct styling for high priority
     * Purpose: Verify high priority tasks use red color scheme
     */
    it('should apply red color scheme for high priority', () => {
      // Arrange
      const task = createMockTask({ priority: 'high' });
      
      // Act
      const { container } = renderWithAppContext(<TaskCard task={task} />);
      
      // Assert - check for red-based background class on card
      const card = container.firstChild as HTMLElement;
      expect(card.className).toMatch(/bg-red-950/);
      expect(card.className).toMatch(/border-red-800/);
    });

    /**
     * Test: Applies correct styling for medium priority
     * Purpose: Verify medium priority tasks use amber color scheme
     */
    it('should apply amber color scheme for medium priority', () => {
      // Arrange
      const task = createMockTask({ priority: 'medium' });
      
      // Act
      const { container } = renderWithAppContext(<TaskCard task={task} />);
      
      // Assert
      const card = container.firstChild as HTMLElement;
      expect(card.className).toMatch(/bg-amber-950/);
      expect(card.className).toMatch(/border-amber-800/);
    });

    /**
     * Test: Applies correct styling for low priority
     * Purpose: Verify low priority tasks use green color scheme
     */
    it('should apply green color scheme for low priority', () => {
      // Arrange
      const task = createMockTask({ priority: 'low' });
      
      // Act
      const { container } = renderWithAppContext(<TaskCard task={task} />);
      
      // Assert
      const card = container.firstChild as HTMLElement;
      expect(card.className).toMatch(/bg-green-950/);
      expect(card.className).toMatch(/border-green-800/);
    });
  });

  // ============================================================
  // RENDERING - DUE DATE
  // ============================================================
  describe('Due Date Rendering', () => {
    /**
     * Test: Displays formatted due date when provided
     * Purpose: Verify due date is formatted and shown
     * 
     * Note: We use a regex to match the date format pattern (e.g., "Dec 25")
     * to avoid timezone-related test flakiness
     */
    it('should display formatted due date when provided', () => {
      // Arrange - use a date in the middle of the month to avoid edge cases
      const dueDate = new Date('2024-12-15T12:00:00');
      const task = createMockTask({ dueDate });
      
      // Act
      renderWithAppContext(<TaskCard task={task} />);
      
      // Assert - match the "MMM d" format pattern (e.g., "Dec 15")
      // Using regex to be resilient to minor timezone variations
      const dateElement = screen.getByText(/Dec \d{1,2}/);
      expect(dateElement).toBeInTheDocument();
    });

    /**
     * Test: Does not render due date section when undefined
     * Purpose: Verify component handles missing due date gracefully
     */
    it('should not render due date when undefined', () => {
      // Arrange
      const task = createMockTask({ dueDate: undefined });
      
      // Act
      renderWithAppContext(<TaskCard task={task} />);
      
      // Assert - no date text should appear
      expect(screen.queryByText(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/)).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // RENDERING - TAGS
  // ============================================================
  describe('Tags Rendering', () => {
    /**
     * Test: Renders all provided tags
     * Purpose: Verify all tags in the array are displayed
     */
    it('should render all provided tags', () => {
      // Arrange
      const task = createMockTask({ tags: ['bug', 'urgent', 'frontend'] });
      
      // Act
      renderWithAppContext(<TaskCard task={task} />);
      
      // Assert
      expect(screen.getByText('bug')).toBeInTheDocument();
      expect(screen.getByText('urgent')).toBeInTheDocument();
      expect(screen.getByText('frontend')).toBeInTheDocument();
    });

    /**
     * Test: Does not render tags section when empty array
     * Purpose: Verify empty tags array doesn't create empty container
     */
    it('should not render tags section when tags array is empty', () => {
      // Arrange
      const task = createMockTask({ tags: [] });
      
      // Act
      const { container } = renderWithAppContext(<TaskCard task={task} />);
      
      // Assert - no tag badges should exist
      const tagBadges = container.querySelectorAll('.bg-stone-800.text-stone-300');
      expect(tagBadges.length).toBe(0);
    });
  });

  // ============================================================
  // COMPLETION STATUS
  // ============================================================
  describe('Completion Status', () => {
    /**
     * Test: Shows Circle icon for incomplete tasks
     * Purpose: Verify todo tasks show unchecked circle
     */
    it('should show Circle icon for incomplete tasks', () => {
      // Arrange
      const task = createMockTask({ status: 'todo' });
      
      // Act
      renderWithAppContext(<TaskCard task={task} />);
      
      // Assert - find button with circle icon (incomplete state)
      const toggleButton = screen.getByRole('button');
      // Circle icon should be present (not CheckCircle2)
      expect(toggleButton.querySelector('svg')).toBeInTheDocument();
      // The button should not have the green color class that indicates completion
      expect(toggleButton.querySelector('.text-green-500')).not.toBeInTheDocument();
    });

    /**
     * Test: Shows CheckCircle2 icon for completed tasks
     * Purpose: Verify completed tasks show checked circle
     */
    it('should show CheckCircle2 icon for completed tasks', () => {
      // Arrange
      const task = createMockTask({ 
        status: 'completed',
        completedAt: new Date() 
      });
      
      // Act
      renderWithAppContext(<TaskCard task={task} />);
      
      // Assert - CheckCircle2 has text-green-500 class
      const toggleButton = screen.getByRole('button');
      expect(toggleButton.querySelector('.text-green-500')).toBeInTheDocument();
    });

    /**
     * Test: Applies strikethrough to title when completed
     * Purpose: Verify visual feedback for completed tasks
     */
    it('should apply strikethrough to title when completed', () => {
      // Arrange
      const task = createMockTask({ 
        title: 'Completed Task',
        status: 'completed' 
      });
      
      // Act
      renderWithAppContext(<TaskCard task={task} />);
      
      // Assert
      const title = screen.getByText('Completed Task');
      expect(title).toHaveClass('line-through');
    });

    /**
     * Test: Does not apply strikethrough to incomplete tasks
     * Purpose: Verify incomplete tasks don't have strikethrough
     */
    it('should not apply strikethrough to incomplete tasks', () => {
      // Arrange
      const task = createMockTask({ 
        title: 'Incomplete Task',
        status: 'todo' 
      });
      
      // Act
      renderWithAppContext(<TaskCard task={task} />);
      
      // Assert
      const title = screen.getByText('Incomplete Task');
      expect(title).not.toHaveClass('line-through');
    });

    /**
     * Test: Applies reduced opacity when completed
     * Purpose: Verify completed tasks are visually de-emphasized
     */
    it('should apply reduced opacity when completed', () => {
      // Arrange
      const task = createMockTask({ status: 'completed' });
      
      // Act
      const { container } = renderWithAppContext(<TaskCard task={task} />);
      
      // Assert
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('opacity-75');
    });

    /**
     * Test: Does not apply reduced opacity to incomplete tasks
     * Purpose: Verify incomplete tasks have full opacity
     */
    it('should not apply reduced opacity to incomplete tasks', () => {
      // Arrange
      const task = createMockTask({ status: 'todo' });
      
      // Act
      const { container } = renderWithAppContext(<TaskCard task={task} />);
      
      // Assert
      const card = container.firstChild as HTMLElement;
      expect(card).not.toHaveClass('opacity-75');
    });
  });

  // ============================================================
  // INTERACTION - TOGGLE COMPLETION
  // ============================================================
  describe('Toggle Completion Interaction', () => {
    /**
     * Test: Toggles from todo to completed on button click
     * Purpose: Verify clicking toggle button dispatches UPDATE_TASK with completed status
     */
    it('should dispatch UPDATE_TASK with completed status when toggling incomplete task', async () => {
      // Arrange
      const task = createMockTask({ 
        id: 'task-123',
        status: 'todo' 
      });
      const { mockDispatch } = renderWithAppContext(<TaskCard task={task} />);
      
      // Act
      const toggleButton = screen.getByRole('button');
      await user.click(toggleButton);
      
      // Assert
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_TASK',
        payload: expect.objectContaining({
          id: 'task-123',
          status: 'completed',
          completedAt: expect.any(Date)
        })
      });
    });

    /**
     * Test: Toggles from completed to todo on button click
     * Purpose: Verify clicking toggle button dispatches UPDATE_TASK with todo status
     */
    it('should dispatch UPDATE_TASK with todo status when toggling completed task', async () => {
      // Arrange
      const task = createMockTask({ 
        id: 'task-456',
        status: 'completed',
        completedAt: new Date() 
      });
      const { mockDispatch } = renderWithAppContext(<TaskCard task={task} />);
      
      // Act
      const toggleButton = screen.getByRole('button');
      await user.click(toggleButton);
      
      // Assert
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_TASK',
        payload: expect.objectContaining({
          id: 'task-456',
          status: 'todo',
          completedAt: undefined
        })
      });
    });

    /**
     * Test: Sets completedAt when completing a task
     * Purpose: Verify completedAt timestamp is set on completion
     */
    it('should set completedAt date when completing a task', async () => {
      // Arrange
      const task = createMockTask({ status: 'todo' });
      const { mockDispatch } = renderWithAppContext(<TaskCard task={task} />);
      
      // Act
      const toggleButton = screen.getByRole('button');
      await user.click(toggleButton);
      
      // Assert
      const dispatchCall = mockDispatch.mock.calls[0][0];
      expect(dispatchCall.payload.completedAt).toBeInstanceOf(Date);
    });

    /**
     * Test: Clears completedAt when uncompleting a task
     * Purpose: Verify completedAt is cleared on uncomplete
     */
    it('should clear completedAt when uncompleting a task', async () => {
      // Arrange
      const task = createMockTask({ 
        status: 'completed',
        completedAt: new Date('2024-01-15') 
      });
      const { mockDispatch } = renderWithAppContext(<TaskCard task={task} />);
      
      // Act
      const toggleButton = screen.getByRole('button');
      await user.click(toggleButton);
      
      // Assert
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_TASK',
        payload: expect.objectContaining({
          completedAt: undefined
        })
      });
    });

    /**
     * Test: Toggle button click stops propagation
     * Purpose: Verify clicking toggle doesn't trigger card click (edit modal)
     */
    it('should stop propagation when toggle button is clicked', async () => {
      // Arrange
      const task = createMockTask({ status: 'todo' });
      const { mockDispatch } = renderWithAppContext(<TaskCard task={task} />);
      
      // Act
      const toggleButton = screen.getByRole('button');
      await user.click(toggleButton);
      
      // Assert - only UPDATE_TASK should be called, and TaskForm should NOT appear
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'UPDATE_TASK' })
      );
      // TaskForm modal should not be visible
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByText('Edit Task')).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // INTERACTION - EDIT MODAL
  // ============================================================
  describe('Edit Modal Interaction', () => {
    /**
     * Test: Opens TaskForm modal on card click
     * Purpose: Verify clicking the card (not toggle) opens edit modal
     */
    it('should open TaskForm modal when card is clicked', async () => {
      // Arrange
      const task = createMockTask({ title: 'Editable Task' });
      const { container } = renderWithAppContext(<TaskCard task={task} />);
      
      // Act - click on the card (not the button)
      const card = container.firstChild as HTMLElement;
      await user.click(card);
      
      // Assert - TaskForm should be visible
      expect(screen.getByText('Edit Task')).toBeInTheDocument();
    });

    /**
     * Test: TaskForm receives the task for editing
     * Purpose: Verify the modal shows current task data
     */
    it('should pass task data to TaskForm for editing', async () => {
      // Arrange
      const task = createMockTask({ 
        title: 'Task to Edit',
        description: 'Original description',
        priority: 'high'
      });
      const { container } = renderWithAppContext(<TaskCard task={task} />);
      
      // Act
      const card = container.firstChild as HTMLElement;
      await user.click(card);
      
      // Assert - form fields should be populated
      const titleInput = screen.getByDisplayValue('Task to Edit');
      expect(titleInput).toBeInTheDocument();
    });

    /**
     * Test: Closes TaskForm when onClose is called
     * Purpose: Verify modal can be dismissed
     */
    it('should close TaskForm when cancel is clicked', async () => {
      // Arrange
      const task = createMockTask({ title: 'Test Task' });
      const { container } = renderWithAppContext(<TaskCard task={task} />);
      
      // Act - open modal
      const card = container.firstChild as HTMLElement;
      await user.click(card);
      
      // Assert modal is open
      expect(screen.getByText('Edit Task')).toBeInTheDocument();
      
      // Act - close modal
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      // Assert modal is closed
      expect(screen.queryByText('Edit Task')).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================
  describe('Edge Cases', () => {
    /**
     * Test: Handles very long task titles
     * Purpose: Verify long text doesn't break layout
     */
    it('should handle very long task titles', () => {
      // Arrange
      const longTitle = 'A'.repeat(200);
      const task = createMockTask({ title: longTitle });
      
      // Act
      renderWithAppContext(<TaskCard task={task} />);
      
      // Assert - title should be rendered
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    /**
     * Test: Handles special characters in title
     * Purpose: Verify HTML special characters are escaped properly
     */
    it('should handle special characters in title safely', () => {
      // Arrange
      const specialTitle = '<script>alert("xss")</script> & "quotes" \'apostrophe\'';
      const task = createMockTask({ title: specialTitle });
      
      // Act
      renderWithAppContext(<TaskCard task={task} />);
      
      // Assert - text should be rendered as text, not HTML
      expect(screen.getByText(specialTitle)).toBeInTheDocument();
    });

    /**
     * Test: Handles unicode and emoji in title
     * Purpose: Verify international characters render correctly
     */
    it('should handle unicode and emoji in title', () => {
      // Arrange
      const unicodeTitle = '🚀 Launch Feature 中文测试 Кириллица';
      const task = createMockTask({ title: unicodeTitle });
      
      // Act
      renderWithAppContext(<TaskCard task={task} />);
      
      // Assert
      expect(screen.getByText(unicodeTitle)).toBeInTheDocument();
    });

    /**
     * Test: Handles task with all optional fields undefined
     * Purpose: Verify minimal task renders correctly
     */
    it('should render correctly with minimal task data', () => {
      // Arrange
      const minimalTask: Task = {
        id: 'minimal-1',
        title: 'Minimal Task',
        priority: 'low',
        status: 'todo',
        createdAt: new Date(),
        tags: []
      };
      
      // Act
      renderWithAppContext(<TaskCard task={minimalTask} />);
      
      // Assert
      expect(screen.getByText('Minimal Task')).toBeInTheDocument();
      expect(screen.getByText('low')).toBeInTheDocument();
    });

    /**
     * Test: Handles in-progress status
     * Purpose: Verify non-completed statuses are treated as incomplete
     */
    it('should treat in-progress status as incomplete', () => {
      // Arrange
      const task = createMockTask({ 
        title: 'In Progress Task',
        status: 'in-progress' 
      });
      
      // Act
      renderWithAppContext(<TaskCard task={task} />);
      
      // Assert - should not have completed styling
      const title = screen.getByText('In Progress Task');
      expect(title).not.toHaveClass('line-through');
    });
  });

  // ============================================================
  // ACCESSIBILITY
  // ============================================================
  describe('Accessibility', () => {
    /**
     * Test: Toggle button is keyboard accessible
     * Purpose: Verify users can toggle completion with keyboard
     */
    it('should allow keyboard interaction for toggle button', async () => {
      // Arrange
      const task = createMockTask({ status: 'todo' });
      const { mockDispatch } = renderWithAppContext(<TaskCard task={task} />);
      
      // Act - focus and press Enter
      const toggleButton = screen.getByRole('button');
      toggleButton.focus();
      await user.keyboard('{Enter}');
      
      // Assert
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'UPDATE_TASK' })
      );
    });

    /**
     * Test: Card is clickable for edit
     * Purpose: Verify card can be activated
     */
    it('should have cursor pointer on card for visual affordance', () => {
      // Arrange
      const task = createMockTask();
      
      // Act
      const { container } = renderWithAppContext(<TaskCard task={task} />);
      
      // Assert
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('cursor-pointer');
    });
  });
});
