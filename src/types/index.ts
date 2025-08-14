export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'completed';
  dueDate?: Date;
  projectId?: string;
  createdAt: Date;
  completedAt?: Date;
  tags: string[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  goalId: string; // NEW: Link to parent goal
  createdAt: Date;
  tasks: Task[];
  progress: number;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetDate: Date;
  progress: number;
  projects: Project[]; // NEW: Contains child projects
  milestones: Milestone[];
  createdAt: Date;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
  taskIds?: string[]; // NEW: Associated task IDs for milestone tracking
  projectId?: string; // NEW: Optional project association
  completionType?: 'auto' | 'manual'; // NEW: Track whether milestone is auto-completed or manually completed
}

export interface Analytics {
  tasksCompleted: number;
  tasksCreated: number;
  productivity: number;
  streakDays: number;
  averageCompletionTime: number;
}

export interface ProfileSettings {
  name: string;
  email: string;
}

export interface NotificationSettings {
  emailTasks: boolean;
  dailySummary: boolean;
  weeklyReports: boolean;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
}

export interface UserSettings {
  profile: ProfileSettings;
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
}

// Utility types for progress calculation
export interface ProgressCalculation {
  total: number;
  completed: number;
  percentage: number;
}

export interface GoalProgress extends ProgressCalculation {
  projectProgress: ProjectProgress[];
}

export interface ProjectProgress extends ProgressCalculation {
  projectId: string;
  taskProgress: TaskProgress[];
}

export interface TaskProgress extends ProgressCalculation {
  taskId: string;
  status: Task['status'];
}