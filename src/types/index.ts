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
  milestones: Milestone[];
  createdAt: Date;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
}

export interface Analytics {
  tasksCompleted: number;
  tasksCreated: number;
  productivity: number;
  streakDays: number;
  averageCompletionTime: number;
}