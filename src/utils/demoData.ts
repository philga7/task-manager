import { Task, Project, Goal, Milestone, Analytics, User } from '../types';

// Demo user data
export const demoUser: User = {
  id: 'demo-user-123',
  name: 'Alex Johnson',
  email: 'alex.johnson@demo.com',
  createdAt: new Date('2024-01-15')
};

// Demo tasks data
export const demoTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Design Homepage Mockup',
    description: 'Create wireframes and mockups for the new company homepage with modern design principles',
    priority: 'high',
    status: 'completed',
    dueDate: new Date('2024-12-20'),
    projectId: 'project-1',
    createdAt: new Date('2024-12-01'),
    completedAt: new Date('2024-12-18'),
    tags: ['design', 'wireframes', 'homepage']
  },
  {
    id: 'task-2',
    title: 'Implement User Authentication',
    description: 'Set up secure user authentication system with JWT tokens and password hashing',
    priority: 'high',
    status: 'in-progress',
    dueDate: new Date('2024-12-25'),
    projectId: 'project-1',
    createdAt: new Date('2024-12-05'),
    tags: ['backend', 'security', 'authentication']
  },
  {
    id: 'task-3',
    title: 'Write API Documentation',
    description: 'Create comprehensive API documentation with examples and usage guidelines',
    priority: 'medium',
    status: 'todo',
    dueDate: new Date('2024-12-30'),
    projectId: 'project-1',
    createdAt: new Date('2024-12-10'),
    tags: ['documentation', 'api', 'technical']
  },
  {
    id: 'task-4',
    title: 'Setup CI/CD Pipeline',
    description: 'Configure automated testing and deployment pipeline using GitHub Actions',
    priority: 'high',
    status: 'completed',
    dueDate: new Date('2024-12-15'),
    projectId: 'project-2',
    createdAt: new Date('2024-11-25'),
    completedAt: new Date('2024-12-12'),
    tags: ['devops', 'ci-cd', 'automation']
  },
  {
    id: 'task-5',
    title: 'Database Schema Design',
    description: 'Design and implement database schema with proper relationships and indexes',
    priority: 'high',
    status: 'completed',
    dueDate: new Date('2024-12-10'),
    projectId: 'project-2',
    createdAt: new Date('2024-11-20'),
    completedAt: new Date('2024-12-08'),
    tags: ['database', 'schema', 'backend']
  },
  {
    id: 'task-6',
    title: 'Unit Test Implementation',
    description: 'Write comprehensive unit tests for all core functionality with 90%+ coverage',
    priority: 'medium',
    status: 'in-progress',
    dueDate: new Date('2024-12-28'),
    projectId: 'project-2',
    createdAt: new Date('2024-12-01'),
    tags: ['testing', 'unit-tests', 'quality']
  },
  {
    id: 'task-7',
    title: 'Mobile App UI Design',
    description: 'Design user interface for mobile application with focus on user experience',
    priority: 'medium',
    status: 'todo',
    dueDate: new Date('2025-01-05'),
    projectId: 'project-3',
    createdAt: new Date('2024-12-15'),
    tags: ['mobile', 'ui-design', 'ux']
  },
  {
    id: 'task-8',
    title: 'Performance Optimization',
    description: 'Optimize application performance through code refactoring and caching strategies',
    priority: 'low',
    status: 'todo',
    dueDate: new Date('2025-01-10'),
    projectId: 'project-3',
    createdAt: new Date('2024-12-18'),
    tags: ['performance', 'optimization', 'refactoring']
  },
  {
    id: 'task-9',
    title: 'Security Audit',
    description: 'Conduct comprehensive security audit and implement necessary fixes',
    priority: 'high',
    status: 'in-progress',
    dueDate: new Date('2024-12-22'),
    projectId: 'project-1',
    createdAt: new Date('2024-12-12'),
    tags: ['security', 'audit', 'compliance']
  },
  {
    id: 'task-10',
    title: 'User Feedback Integration',
    description: 'Implement user feedback system with rating and comment functionality',
    priority: 'medium',
    status: 'todo',
    dueDate: new Date('2025-01-15'),
    projectId: 'project-3',
    createdAt: new Date('2024-12-20'),
    tags: ['feedback', 'user-experience', 'features']
  },
  {
    id: 'task-11',
    title: 'Deployment to Production',
    description: 'Deploy application to production environment with monitoring setup',
    priority: 'high',
    status: 'completed',
    dueDate: new Date('2024-12-18'),
    projectId: 'project-2',
    createdAt: new Date('2024-12-10'),
    completedAt: new Date('2024-12-16'),
    tags: ['deployment', 'production', 'monitoring']
  },
  {
    id: 'task-12',
    title: 'Code Review Process',
    description: 'Establish code review process and guidelines for team collaboration',
    priority: 'low',
    status: 'completed',
    dueDate: new Date('2024-12-05'),
    projectId: 'project-2',
    createdAt: new Date('2024-11-15'),
    completedAt: new Date('2024-12-03'),
    tags: ['process', 'collaboration', 'quality']
  }
];

// Demo projects data
export const demoProjects: Project[] = [
  {
    id: 'project-1',
    name: 'Web Application Development',
    description: 'Building a modern web application with React and Node.js',
    color: '#3B82F6', // Blue
    goalId: 'goal-1',
    createdAt: new Date('2024-11-01'),
    tasks: demoTasks.filter(task => task.projectId === 'project-1'),
    progress: 65
  },
  {
    id: 'project-2',
    name: 'DevOps Infrastructure',
    description: 'Setting up robust DevOps infrastructure and deployment pipeline',
    color: '#10B981', // Green
    goalId: 'goal-1',
    createdAt: new Date('2024-11-15'),
    tasks: demoTasks.filter(task => task.projectId === 'project-2'),
    progress: 85
  },
  {
    id: 'project-3',
    name: 'Mobile App Development',
    description: 'Developing cross-platform mobile application with React Native',
    color: '#F59E0B', // Amber
    goalId: 'goal-2',
    createdAt: new Date('2024-12-01'),
    tasks: demoTasks.filter(task => task.projectId === 'project-3'),
    progress: 25
  },
  {
    id: 'project-4',
    name: 'Quality Assurance',
    description: 'Implementing comprehensive testing and quality assurance processes',
    color: '#EF4444', // Red
    goalId: 'goal-2',
    createdAt: new Date('2024-12-10'),
    tasks: [],
    progress: 0
  }
];

// Demo milestones data
export const demoMilestones: Milestone[] = [
  {
    id: 'milestone-1',
    title: 'Frontend Development Complete',
    completed: true,
    completedAt: new Date('2024-12-18'),
    taskIds: ['task-1'],
    projectId: 'project-1',
    completionType: 'auto'
  },
  {
    id: 'milestone-2',
    title: 'Backend API Implementation',
    completed: false,
    taskIds: ['task-2', 'task-3'],
    projectId: 'project-1',
    completionType: 'auto'
  },
  {
    id: 'milestone-3',
    title: 'DevOps Setup Complete',
    completed: true,
    completedAt: new Date('2024-12-12'),
    taskIds: ['task-4', 'task-5'],
    projectId: 'project-2',
    completionType: 'auto'
  },
  {
    id: 'milestone-4',
    title: 'Testing Implementation',
    completed: false,
    taskIds: ['task-6'],
    projectId: 'project-2',
    completionType: 'auto'
  },
  {
    id: 'milestone-5',
    title: 'Production Deployment',
    completed: true,
    completedAt: new Date('2024-12-16'),
    taskIds: ['task-11'],
    projectId: 'project-2',
    completionType: 'auto'
  },
  {
    id: 'milestone-6',
    title: 'Mobile App Design',
    completed: false,
    taskIds: ['task-7'],
    projectId: 'project-3',
    completionType: 'auto'
  },
  {
    id: 'milestone-7',
    title: 'Project Launch',
    completed: false,
    completionType: 'manual'
  }
];

// Demo goals data
export const demoGoals: Goal[] = [
  {
    id: 'goal-1',
    title: 'Launch Web Application',
    description: 'Successfully launch a modern web application with full-stack development',
    targetDate: new Date('2024-12-31'),
    progress: 75,
    projects: demoProjects.filter(project => project.goalId === 'goal-1'),
    milestones: demoMilestones.filter(milestone => 
      milestone.projectId && demoProjects.find(p => p.id === milestone.projectId)?.goalId === 'goal-1'
    ),
    createdAt: new Date('2024-10-15')
  },
  {
    id: 'goal-2',
    title: 'Expand to Mobile Platform',
    description: 'Develop and launch mobile application to expand user reach',
    targetDate: new Date('2025-02-28'),
    progress: 15,
    projects: demoProjects.filter(project => project.goalId === 'goal-2'),
    milestones: demoMilestones.filter(milestone => 
      milestone.projectId && demoProjects.find(p => p.id === milestone.projectId)?.goalId === 'goal-2'
    ),
    createdAt: new Date('2024-11-30')
  }
];

// Demo analytics data
export const demoAnalytics: Analytics = {
  tasksCompleted: 6,
  tasksCreated: 12,
  productivity: 78,
  streakDays: 8,
  averageCompletionTime: 4.2
};

// Function to generate complete demo state
export function generateDemoState() {
  return {
    tasks: demoTasks,
    projects: demoProjects,
    goals: demoGoals,
    analytics: demoAnalytics,
    searchQuery: '',
    selectedProject: null,
    selectedPriority: null,
    userSettings: {
      profile: {
        name: demoUser.name,
        email: demoUser.email
      },
      notifications: {
        emailTasks: true,
        dailySummary: true,
        weeklyReports: false
      },
      appearance: {
        theme: 'dark' as const,
        accentColor: '#D97757'
      }
    },
    authentication: {
      user: demoUser,
      isAuthenticated: true,
      isDemoMode: true
    }
  };
}

// Function to get demo data by type
export function getDemoData<T extends keyof ReturnType<typeof generateDemoState>>(
  dataType: T
): ReturnType<typeof generateDemoState>[T] {
  const demoState = generateDemoState();
  return demoState[dataType];
}

// Function to reset demo data (useful for testing)
export function resetDemoData() {
  return generateDemoState();
}
