/**
 * Test Suite: TaskForm Component
 * 
 * Purpose: Validate TaskForm component for creating and editing tasks
 * 
 * This test suite covers:
 * 1. Create mode vs Edit mode rendering
 * 2. Form field population and changes
 * 3. Form submission (ADD_TASK vs UPDATE_TASK)
 * 4. Form validation (required fields)
 * 5. Tag parsing (comma-separated to array)
 * 6. Date handling (Date objects, strings, undefined)
 * 7. Modal interactions (close, cancel)
 * 8. Edge cases (special characters, long text)
 * 
 * Component Dependencies:
 * - AppContext (useApp hook) for state and dispatch
 * - Button component
 * - Card component
 * - lucide-react for icons
 * 
 * @see src/components/Tasks/TaskForm.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { TaskForm } from './TaskForm';
import { 
  renderWithAppContext, 
  createMockTask, 
  createMockProject 
} from '../../tests/test-utils';
import { Project } from '../../types';

/**
 * Helper to get form elements by their associated label text
 * Since the form doesn't use htmlFor/id associations, we find by nearby text
 */
const getFormElements = (container: HTMLElement) => ({
  // Find by placeholder text for inputs
  titleInput: () => screen.getByPlaceholderText(/enter task title/i),
  descriptionInput: () => screen.getByPlaceholderText(/add description/i),
  tagsInput: () => screen.getByPlaceholderText(/enter tags separated by commas/i),
  
  // Find selects by their position (Priority is first, Project is second)
  prioritySelect: () => container.querySelectorAll('select')[0] as HTMLSelectElement,
  projectSelect: () => container.querySelectorAll('select')[1] as HTMLSelectElement,
  
  // Find date input by type
  dateInput: () => container.querySelector('input[type="date"]') as HTMLInputElement,
});

describe('TaskForm Component', () => {
  // Common setup
  let user: ReturnType<typeof userEvent.setup>;
  let mockOnClose: ReturnType<typeof vi.fn>;
  
  beforeEach(() => {
    user = userEvent.setup();
    mockOnClose = vi.fn();
  });

  // ============================================================
  // RENDERING - CREATE MODE
  // ============================================================
  describe('Create Mode Rendering', () => {
    /**
     * Test: Shows "New Task" heading for new task
     * Purpose: Verify heading indicates create mode when no task prop
     */
    it('should show "New Task" heading when creating a new task', () => {
      // Arrange & Act
      renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      
      // Assert
      expect(screen.getByRole('heading', { name: /new task/i })).toBeInTheDocument();
    });

    /**
     * Test: Shows "Create Task" button for new task
     * Purpose: Verify submit button text indicates create action
     */
    it('should show "Create Task" button when creating a new task', () => {
      // Arrange & Act
      renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      
      // Assert
      expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
    });

    /**
     * Test: Title input is empty initially
     * Purpose: Verify form starts with empty fields in create mode
     */
    it('should have empty title input initially', () => {
      // Arrange & Act
      renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      
      // Assert
      const titleInput = screen.getByPlaceholderText(/enter task title/i);
      expect(titleInput).toHaveValue('');
    });

    /**
     * Test: Description textarea is empty initially
     * Purpose: Verify description starts empty
     */
    it('should have empty description initially', () => {
      // Arrange & Act
      renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      
      // Assert
      const descriptionInput = screen.getByPlaceholderText(/add description/i);
      expect(descriptionInput).toHaveValue('');
    });

    /**
     * Test: Priority defaults to medium
     * Purpose: Verify default priority selection
     */
    it('should default priority to medium', () => {
      // Arrange & Act
      const { container } = renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      const { prioritySelect } = getFormElements(container);
      
      // Assert
      expect(prioritySelect()).toHaveValue('medium');
    });

    /**
     * Test: Due date is empty initially
     * Purpose: Verify no default due date
     */
    it('should have empty due date initially', () => {
      // Arrange & Act
      const { container } = renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      const { dateInput } = getFormElements(container);
      
      // Assert
      expect(dateInput()).toHaveValue('');
    });

    /**
     * Test: Tags input is empty initially
     * Purpose: Verify tags field starts empty
     */
    it('should have empty tags input initially', () => {
      // Arrange & Act
      renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      
      // Assert
      const tagsInput = screen.getByPlaceholderText(/enter tags separated by commas/i);
      expect(tagsInput).toHaveValue('');
    });
  });

  // ============================================================
  // RENDERING - EDIT MODE
  // ============================================================
  describe('Edit Mode Rendering', () => {
    /**
     * Test: Shows "Edit Task" heading when editing
     * Purpose: Verify heading indicates edit mode when task prop provided
     */
    it('should show "Edit Task" heading when editing existing task', () => {
      // Arrange
      const task = createMockTask({ title: 'Existing Task' });
      
      // Act
      renderWithAppContext(<TaskForm onClose={mockOnClose} task={task} />);
      
      // Assert
      expect(screen.getByRole('heading', { name: /edit task/i })).toBeInTheDocument();
    });

    /**
     * Test: Shows "Update Task" button when editing
     * Purpose: Verify submit button text indicates update action
     */
    it('should show "Update Task" button when editing', () => {
      // Arrange
      const task = createMockTask();
      
      // Act
      renderWithAppContext(<TaskForm onClose={mockOnClose} task={task} />);
      
      // Assert
      expect(screen.getByRole('button', { name: /update task/i })).toBeInTheDocument();
    });

    /**
     * Test: Populates title from existing task
     * Purpose: Verify form is pre-filled with task data
     */
    it('should populate title from existing task', () => {
      // Arrange
      const task = createMockTask({ title: 'Pre-existing Title' });
      
      // Act
      renderWithAppContext(<TaskForm onClose={mockOnClose} task={task} />);
      
      // Assert
      expect(screen.getByDisplayValue('Pre-existing Title')).toBeInTheDocument();
    });

    /**
     * Test: Populates description from existing task
     * Purpose: Verify description is pre-filled
     */
    it('should populate description from existing task', () => {
      // Arrange
      const task = createMockTask({ description: 'Existing description text' });
      
      // Act
      renderWithAppContext(<TaskForm onClose={mockOnClose} task={task} />);
      
      // Assert
      expect(screen.getByDisplayValue('Existing description text')).toBeInTheDocument();
    });

    /**
     * Test: Populates priority from existing task
     * Purpose: Verify priority select is pre-selected
     */
    it('should populate priority from existing task', () => {
      // Arrange
      const task = createMockTask({ priority: 'high' });
      
      // Act
      const { container } = renderWithAppContext(<TaskForm onClose={mockOnClose} task={task} />);
      const { prioritySelect } = getFormElements(container);
      
      // Assert
      expect(prioritySelect()).toHaveValue('high');
    });

    /**
     * Test: Populates due date from existing task (Date object)
     * Purpose: Verify Date objects are formatted correctly for input
     */
    it('should populate due date from Date object', () => {
      // Arrange
      const task = createMockTask({ dueDate: new Date('2024-12-25') });
      
      // Act
      const { container } = renderWithAppContext(<TaskForm onClose={mockOnClose} task={task} />);
      const { dateInput } = getFormElements(container);
      
      // Assert
      expect(dateInput()).toHaveValue('2024-12-25');
    });

    /**
     * Test: Populates tags from existing task
     * Purpose: Verify tags array is converted to comma-separated string
     */
    it('should populate tags as comma-separated string', () => {
      // Arrange
      const task = createMockTask({ tags: ['bug', 'urgent', 'frontend'] });
      
      // Act
      renderWithAppContext(<TaskForm onClose={mockOnClose} task={task} />);
      
      // Assert
      expect(screen.getByDisplayValue('bug, urgent, frontend')).toBeInTheDocument();
    });
  });

  // ============================================================
  // RENDERING - PROJECTS DROPDOWN
  // ============================================================
  describe('Projects Dropdown', () => {
    /**
     * Test: Shows "No Project" as default option
     * Purpose: Verify unassigned project option exists
     */
    it('should show "No Project" option in project dropdown', () => {
      // Arrange & Act
      const { container } = renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      const { projectSelect } = getFormElements(container);
      
      // Assert
      const noProjectOption = within(projectSelect()).getByRole('option', { name: /no project/i });
      expect(noProjectOption).toBeInTheDocument();
    });

    /**
     * Test: Displays all projects from context
     * Purpose: Verify projects from state are rendered in dropdown
     */
    it('should display all projects from context state', () => {
      // Arrange
      const projects: Project[] = [
        createMockProject({ id: 'proj-1', name: 'Project Alpha' }),
        createMockProject({ id: 'proj-2', name: 'Project Beta' }),
        createMockProject({ id: 'proj-3', name: 'Project Gamma' })
      ];
      
      // Act
      renderWithAppContext(<TaskForm onClose={mockOnClose} />, {
        initialState: { projects }
      });
      
      // Assert
      expect(screen.getByRole('option', { name: 'Project Alpha' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Project Beta' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Project Gamma' })).toBeInTheDocument();
    });

    /**
     * Test: Pre-selects project when editing task with projectId
     * Purpose: Verify project selection is preserved in edit mode
     */
    it('should pre-select project when editing task with projectId', () => {
      // Arrange
      const projects: Project[] = [
        createMockProject({ id: 'proj-1', name: 'Selected Project' })
      ];
      const task = createMockTask({ projectId: 'proj-1' });
      
      // Act
      const { container } = renderWithAppContext(<TaskForm onClose={mockOnClose} task={task} />, {
        initialState: { projects }
      });
      const { projectSelect } = getFormElements(container);
      
      // Assert
      expect(projectSelect()).toHaveValue('proj-1');
    });
  });

  // ============================================================
  // FORM FIELD CHANGES
  // ============================================================
  describe('Form Field Changes', () => {
    /**
     * Test: Updates title on input change
     * Purpose: Verify title input is controlled
     */
    it('should update title when user types', async () => {
      // Arrange
      renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      const titleInput = screen.getByPlaceholderText(/enter task title/i);
      
      // Act
      await user.type(titleInput, 'New Task Title');
      
      // Assert
      expect(titleInput).toHaveValue('New Task Title');
    });

    /**
     * Test: Updates description on textarea change
     * Purpose: Verify description textarea is controlled
     */
    it('should update description when user types', async () => {
      // Arrange
      renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      const descInput = screen.getByPlaceholderText(/add description/i);
      
      // Act
      await user.type(descInput, 'Task description here');
      
      // Assert
      expect(descInput).toHaveValue('Task description here');
    });

    /**
     * Test: Updates priority on select change
     * Purpose: Verify priority select is controlled
     */
    it('should update priority when user selects', async () => {
      // Arrange
      const { container } = renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      const { prioritySelect } = getFormElements(container);
      
      // Act
      await user.selectOptions(prioritySelect(), 'high');
      
      // Assert
      expect(prioritySelect()).toHaveValue('high');
    });

    /**
     * Test: Updates due date on input change
     * Purpose: Verify date input is controlled
     */
    it('should update due date when user selects date', async () => {
      // Arrange
      const { container } = renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      const { dateInput } = getFormElements(container);
      
      // Act
      // Clear any existing value first, then type
      await user.clear(dateInput());
      await user.type(dateInput(), '2024-12-31');
      
      // Assert
      expect(dateInput()).toHaveValue('2024-12-31');
    });

    /**
     * Test: Updates project on select change
     * Purpose: Verify project select is controlled
     */
    it('should update project when user selects', async () => {
      // Arrange
      const projects: Project[] = [
        createMockProject({ id: 'proj-1', name: 'Test Project' })
      ];
      const { container } = renderWithAppContext(<TaskForm onClose={mockOnClose} />, {
        initialState: { projects }
      });
      const { projectSelect } = getFormElements(container);
      
      // Act
      await user.selectOptions(projectSelect(), 'proj-1');
      
      // Assert
      expect(projectSelect()).toHaveValue('proj-1');
    });

    /**
     * Test: Updates tags on input change
     * Purpose: Verify tags input is controlled
     */
    it('should update tags when user types', async () => {
      // Arrange
      renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      const tagsInput = screen.getByPlaceholderText(/enter tags separated by commas/i);
      
      // Act
      await user.type(tagsInput, 'bug, urgent, fix');
      
      // Assert
      expect(tagsInput).toHaveValue('bug, urgent, fix');
    });
  });

  // ============================================================
  // FORM SUBMISSION - CREATE
  // ============================================================
  describe('Form Submission - Create', () => {
    /**
     * Test: Dispatches ADD_TASK when creating new task
     * Purpose: Verify new task creation dispatches correct action
     */
    it('should dispatch ADD_TASK when submitting new task', async () => {
      // Arrange
      const { mockDispatch } = renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      
      // Act
      await user.type(screen.getByPlaceholderText(/enter task title/i), 'New Task');
      await user.click(screen.getByRole('button', { name: /create task/i }));
      
      // Assert
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ADD_TASK',
        payload: expect.objectContaining({
          title: 'New Task',
          status: 'todo'
        })
      });
    });

    /**
     * Test: Generates unique ID for new tasks
     * Purpose: Verify new tasks get unique identifiers
     */
    it('should generate task ID for new tasks', async () => {
      // Arrange
      const { mockDispatch } = renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      
      // Act
      await user.type(screen.getByPlaceholderText(/enter task title/i), 'New Task');
      await user.click(screen.getByRole('button', { name: /create task/i }));
      
      // Assert
      const dispatchCall = mockDispatch.mock.calls[0][0];
      expect(dispatchCall.payload.id).toMatch(/^task-\d+$/);
    });

    /**
     * Test: Sets createdAt for new tasks
     * Purpose: Verify timestamp is set on creation
     */
    it('should set createdAt date for new tasks', async () => {
      // Arrange
      const { mockDispatch } = renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      
      // Act
      await user.type(screen.getByPlaceholderText(/enter task title/i), 'New Task');
      await user.click(screen.getByRole('button', { name: /create task/i }));
      
      // Assert
      const dispatchCall = mockDispatch.mock.calls[0][0];
      expect(dispatchCall.payload.createdAt).toBeInstanceOf(Date);
    });

    /**
     * Test: Parses comma-separated tags correctly
     * Purpose: Verify tag string is split into array
     */
    it('should parse comma-separated tags into array', async () => {
      // Arrange
      const { mockDispatch } = renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      
      // Act
      await user.type(screen.getByPlaceholderText(/enter task title/i), 'Tagged Task');
      await user.type(screen.getByPlaceholderText(/enter tags separated by commas/i), 'bug, urgent, frontend');
      await user.click(screen.getByRole('button', { name: /create task/i }));
      
      // Assert
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ADD_TASK',
        payload: expect.objectContaining({
          tags: ['bug', 'urgent', 'frontend']
        })
      });
    });

    /**
     * Test: Trims whitespace from tags
     * Purpose: Verify extra spaces are removed from tags
     */
    it('should trim whitespace from tags', async () => {
      // Arrange
      const { mockDispatch } = renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      
      // Act
      await user.type(screen.getByPlaceholderText(/enter task title/i), 'Task');
      await user.type(screen.getByPlaceholderText(/enter tags separated by commas/i), '  bug  ,   urgent  ,  fix  ');
      await user.click(screen.getByRole('button', { name: /create task/i }));
      
      // Assert
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ADD_TASK',
        payload: expect.objectContaining({
          tags: ['bug', 'urgent', 'fix']
        })
      });
    });

    /**
     * Test: Filters empty tags
     * Purpose: Verify empty strings from consecutive commas are removed
     */
    it('should filter out empty tags', async () => {
      // Arrange
      const { mockDispatch } = renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      
      // Act
      await user.type(screen.getByPlaceholderText(/enter task title/i), 'Task');
      await user.type(screen.getByPlaceholderText(/enter tags separated by commas/i), 'bug,, urgent,, ,fix');
      await user.click(screen.getByRole('button', { name: /create task/i }));
      
      // Assert
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ADD_TASK',
        payload: expect.objectContaining({
          tags: ['bug', 'urgent', 'fix']
        })
      });
    });

    /**
     * Test: Calls onClose after successful creation
     * Purpose: Verify modal closes after submission
     */
    it('should call onClose after creating task', async () => {
      // Arrange
      renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      
      // Act
      await user.type(screen.getByPlaceholderText(/enter task title/i), 'New Task');
      await user.click(screen.getByRole('button', { name: /create task/i }));
      
      // Assert
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // FORM SUBMISSION - UPDATE
  // ============================================================
  describe('Form Submission - Update', () => {
    /**
     * Test: Dispatches UPDATE_TASK when editing existing task
     * Purpose: Verify task update dispatches correct action
     */
    it('should dispatch UPDATE_TASK when submitting edited task', async () => {
      // Arrange
      const task = createMockTask({ id: 'existing-task-123', title: 'Original Title' });
      const { mockDispatch } = renderWithAppContext(<TaskForm onClose={mockOnClose} task={task} />);
      
      // Act
      const titleInput = screen.getByDisplayValue('Original Title');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Title');
      await user.click(screen.getByRole('button', { name: /update task/i }));
      
      // Assert
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_TASK',
        payload: expect.objectContaining({
          id: 'existing-task-123',
          title: 'Updated Title'
        })
      });
    });

    /**
     * Test: Preserves task ID when updating
     * Purpose: Verify ID is not regenerated on update
     */
    it('should preserve task ID when updating', async () => {
      // Arrange
      const task = createMockTask({ id: 'keep-this-id' });
      const { mockDispatch } = renderWithAppContext(<TaskForm onClose={mockOnClose} task={task} />);
      
      // Act
      await user.click(screen.getByRole('button', { name: /update task/i }));
      
      // Assert
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_TASK',
        payload: expect.objectContaining({
          id: 'keep-this-id'
        })
      });
    });

    /**
     * Test: Preserves createdAt when updating
     * Purpose: Verify creation timestamp is not changed on update
     */
    it('should preserve createdAt when updating', async () => {
      // Arrange
      const originalDate = new Date('2024-01-01');
      const task = createMockTask({ createdAt: originalDate });
      const { mockDispatch } = renderWithAppContext(<TaskForm onClose={mockOnClose} task={task} />);
      
      // Act
      await user.click(screen.getByRole('button', { name: /update task/i }));
      
      // Assert
      const dispatchCall = mockDispatch.mock.calls[0][0];
      expect(dispatchCall.payload.createdAt).toEqual(originalDate);
    });

    /**
     * Test: Preserves completedAt when updating
     * Purpose: Verify completion timestamp is preserved on update
     */
    it('should preserve completedAt when updating', async () => {
      // Arrange
      const completedDate = new Date('2024-06-15');
      const task = createMockTask({ 
        status: 'completed',
        completedAt: completedDate 
      });
      const { mockDispatch } = renderWithAppContext(<TaskForm onClose={mockOnClose} task={task} />);
      
      // Act
      await user.click(screen.getByRole('button', { name: /update task/i }));
      
      // Assert
      const dispatchCall = mockDispatch.mock.calls[0][0];
      expect(dispatchCall.payload.completedAt).toEqual(completedDate);
    });

    /**
     * Test: Preserves status when updating
     * Purpose: Verify status is not reset on update
     */
    it('should preserve task status when updating', async () => {
      // Arrange
      const task = createMockTask({ status: 'in-progress' });
      const { mockDispatch } = renderWithAppContext(<TaskForm onClose={mockOnClose} task={task} />);
      
      // Act
      await user.click(screen.getByRole('button', { name: /update task/i }));
      
      // Assert
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_TASK',
        payload: expect.objectContaining({
          status: 'in-progress'
        })
      });
    });

    /**
     * Test: Calls onClose after successful update
     * Purpose: Verify modal closes after update
     */
    it('should call onClose after updating task', async () => {
      // Arrange
      const task = createMockTask();
      renderWithAppContext(<TaskForm onClose={mockOnClose} task={task} />);
      
      // Act
      await user.click(screen.getByRole('button', { name: /update task/i }));
      
      // Assert
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // MODAL INTERACTIONS
  // ============================================================
  describe('Modal Interactions', () => {
    /**
     * Test: Calls onClose when Cancel button clicked
     * Purpose: Verify cancel button dismisses modal
     */
    it('should call onClose when Cancel button is clicked', async () => {
      // Arrange
      renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      
      // Act
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      
      // Assert
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    /**
     * Test: Calls onClose when X button clicked
     * Purpose: Verify close icon dismisses modal
     */
    it('should call onClose when X button is clicked', async () => {
      // Arrange
      const { container } = renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      
      // Act - find the X button (it's the button without text content in the header)
      const closeButton = container.querySelector('button > svg.lucide-x')?.parentElement;
      if (closeButton) {
        await user.click(closeButton);
      }
      
      // Assert
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    /**
     * Test: Does not dispatch when Cancel clicked (without filling form)
     * Purpose: Verify cancel doesn't save when no changes made
     */
    it('should not dispatch any action when Cancel is clicked', async () => {
      // Arrange
      const { mockDispatch } = renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      
      // Act - just click cancel without typing anything
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      // Assert - no ADD_TASK or UPDATE_TASK should be dispatched
      const taskActions = mockDispatch.mock.calls.filter(
        call => call[0].type === 'ADD_TASK' || call[0].type === 'UPDATE_TASK'
      );
      expect(taskActions).toHaveLength(0);
    });
  });

  // ============================================================
  // FORM VALIDATION
  // ============================================================
  describe('Form Validation', () => {
    /**
     * Test: Title field is required
     * Purpose: Verify form requires title before submission
     */
    it('should have required attribute on title input', () => {
      // Arrange & Act
      renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      
      // Assert
      const titleInput = screen.getByPlaceholderText(/enter task title/i);
      expect(titleInput).toBeRequired();
    });

    /**
     * Test: Description field is optional
     * Purpose: Verify description is not required
     */
    it('should not require description', async () => {
      // Arrange
      const { mockDispatch } = renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      
      // Act - submit with title only
      await user.type(screen.getByPlaceholderText(/enter task title/i), 'Title Only Task');
      await user.click(screen.getByRole('button', { name: /create task/i }));
      
      // Assert - should submit successfully
      expect(mockDispatch).toHaveBeenCalled();
    });

    /**
     * Test: Due date field is optional
     * Purpose: Verify due date is not required
     */
    it('should submit with undefined dueDate when not provided', async () => {
      // Arrange
      const { mockDispatch } = renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      
      // Act
      await user.type(screen.getByPlaceholderText(/enter task title/i), 'No Due Date Task');
      await user.click(screen.getByRole('button', { name: /create task/i }));
      
      // Assert
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ADD_TASK',
        payload: expect.objectContaining({
          dueDate: undefined
        })
      });
    });

    /**
     * Test: Project field is optional
     * Purpose: Verify project assignment is not required
     */
    it('should submit with undefined projectId when no project selected', async () => {
      // Arrange
      const { mockDispatch } = renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      
      // Act
      await user.type(screen.getByPlaceholderText(/enter task title/i), 'Unassigned Task');
      await user.click(screen.getByRole('button', { name: /create task/i }));
      
      // Assert
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ADD_TASK',
        payload: expect.objectContaining({
          projectId: undefined
        })
      });
    });
  });

  // ============================================================
  // formatDueDate HELPER FUNCTION (via component behavior)
  // ============================================================
  describe('Due Date Formatting', () => {
    /**
     * Test: Handles undefined due date
     * Purpose: Verify undefined dates don't cause errors
     */
    it('should handle task with undefined dueDate', () => {
      // Arrange
      const task = createMockTask({ dueDate: undefined });
      
      // Act
      const { container } = renderWithAppContext(<TaskForm onClose={mockOnClose} task={task} />);
      const { dateInput } = getFormElements(container);
      
      // Assert
      expect(dateInput()).toHaveValue('');
    });

    /**
     * Test: Handles Date object for dueDate
     * Purpose: Verify Date objects are formatted to YYYY-MM-DD
     */
    it('should format Date object to YYYY-MM-DD', () => {
      // Arrange
      const task = createMockTask({ dueDate: new Date('2024-06-15T12:00:00') });
      
      // Act
      const { container } = renderWithAppContext(<TaskForm onClose={mockOnClose} task={task} />);
      const { dateInput } = getFormElements(container);
      
      // Assert
      expect(dateInput()).toHaveValue('2024-06-15');
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================
  describe('Edge Cases', () => {
    /**
     * Test: Handles very long description
     * Purpose: Verify long text doesn't break the form
     * 
     * Note: We use paste simulation instead of typing to avoid timeout
     */
    it('should handle very long description', async () => {
      // Arrange
      const longDescription = 'A'.repeat(5000);
      const { mockDispatch } = renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      const descInput = screen.getByPlaceholderText(/add description/i);
      
      // Act - use paste for long text to avoid timeout
      await user.type(screen.getByPlaceholderText(/enter task title/i), 'Long Desc Task');
      // Simulate paste by setting value directly and triggering change
      await user.click(descInput);
      await user.paste(longDescription);
      await user.click(screen.getByRole('button', { name: /create task/i }));
      
      // Assert
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ADD_TASK',
        payload: expect.objectContaining({
          description: longDescription
        })
      });
    });

    /**
     * Test: Handles special characters in form fields
     * Purpose: Verify HTML special characters are handled safely
     */
    it('should handle special characters safely', async () => {
      // Arrange - use a shorter special string to avoid issues
      const specialTitle = '<script>alert</script>';
      const { mockDispatch } = renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      const titleInput = screen.getByPlaceholderText(/enter task title/i);
      
      // Act - paste instead of type to handle special chars better
      await user.click(titleInput);
      await user.paste(specialTitle);
      await user.click(screen.getByRole('button', { name: /create task/i }));
      
      // Assert
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ADD_TASK',
        payload: expect.objectContaining({
          title: specialTitle
        })
      });
    });

    /**
     * Test: Handles unicode and emoji in fields
     * Purpose: Verify international characters are supported
     */
    it('should handle unicode and emoji in fields', async () => {
      // Arrange
      const unicodeTitle = '🚀 Launch 中文';
      const { mockDispatch } = renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      const titleInput = screen.getByPlaceholderText(/enter task title/i);
      
      // Act - use paste for unicode to ensure proper handling
      await user.click(titleInput);
      await user.paste(unicodeTitle);
      await user.click(screen.getByRole('button', { name: /create task/i }));
      
      // Assert
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ADD_TASK',
        payload: expect.objectContaining({
          title: unicodeTitle
        })
      });
    });

    /**
     * Test: Handles empty tags string
     * Purpose: Verify empty tags results in empty array
     */
    it('should create empty tags array when tags input is empty', async () => {
      // Arrange
      const { mockDispatch } = renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      
      // Act
      await user.type(screen.getByPlaceholderText(/enter task title/i), 'No Tags Task');
      await user.click(screen.getByRole('button', { name: /create task/i }));
      
      // Assert
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ADD_TASK',
        payload: expect.objectContaining({
          tags: []
        })
      });
    });

    /**
     * Test: Converts due date string to Date object on submit
     * Purpose: Verify date input value becomes Date object
     */
    it('should convert due date string to Date object on submit', async () => {
      // Arrange
      const { container, mockDispatch } = renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      const { dateInput } = getFormElements(container);
      
      // Act
      await user.type(screen.getByPlaceholderText(/enter task title/i), 'Dated Task');
      await user.clear(dateInput());
      await user.type(dateInput(), '2024-12-31');
      await user.click(screen.getByRole('button', { name: /create task/i }));
      
      // Assert
      const dispatchCall = mockDispatch.mock.calls[0][0];
      expect(dispatchCall.payload.dueDate).toBeInstanceOf(Date);
    });
  });

  // ============================================================
  // ACCESSIBILITY
  // ============================================================
  describe('Accessibility', () => {
    /**
     * Test: Form fields are accessible via placeholder or label text
     * Purpose: Verify form is usable for all users
     * 
     * Note: The form uses visual labels with icons, but inputs are
     * accessible via placeholder text. This tests that fields exist.
     */
    it('should have accessible form fields', () => {
      // Arrange & Act
      const { container } = renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      const elements = getFormElements(container);
      
      // Assert - all main fields should exist and be accessible
      expect(elements.titleInput()).toBeInTheDocument();
      expect(elements.descriptionInput()).toBeInTheDocument();
      expect(elements.prioritySelect()).toBeInTheDocument();
      expect(elements.dateInput()).toBeInTheDocument();
      expect(elements.projectSelect()).toBeInTheDocument();
      expect(elements.tagsInput()).toBeInTheDocument();
      
      // Verify the form has the expected number of inputs and selects
      const allInputs = container.querySelectorAll('input');
      const allSelects = container.querySelectorAll('select');
      const allTextareas = container.querySelectorAll('textarea');
      
      // 3 inputs: title (text), due date (date), tags (text)
      expect(allInputs.length).toBe(3);
      // 2 selects: priority, project
      expect(allSelects.length).toBe(2);
      // 1 textarea: description
      expect(allTextareas.length).toBe(1);
    });

    /**
     * Test: Submit button is keyboard accessible
     * Purpose: Verify form can be submitted via keyboard
     */
    it('should allow form submission via Enter key', async () => {
      // Arrange
      const { mockDispatch } = renderWithAppContext(<TaskForm onClose={mockOnClose} />);
      const titleInput = screen.getByPlaceholderText(/enter task title/i);
      
      // Act
      await user.type(titleInput, 'Keyboard Submit Task');
      await user.keyboard('{Enter}');
      
      // Assert
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'ADD_TASK' })
      );
    });
  });
});
