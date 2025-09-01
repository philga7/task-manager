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
  // Parallel execution properties
  parallelExecution?: {
    enabled: boolean;
    workstreams: Workstream[];
    dependencies: WorkstreamDependency[];
    estimatedTotalDuration?: number; // in minutes
    actualTotalDuration?: number; // in minutes
  };
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

// Authentication types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface AuthenticationState {
  user: User | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
}

// Mobile browser compatibility types
export interface MobileBrowserInfo {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isPrivateBrowsing: boolean;
  browserName: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
  supportsLocalStorage: boolean;
  supportsSessionStorage: boolean;
  supportsIndexedDB: boolean;
  supportsCookies: boolean;
  storageQuota: number | null;
  hasStorageQuota: boolean;
}

export interface MobileCompatibilityInfo {
  hasIssues: boolean;
  issues: string[];
  recommendations: string[];
  errorMessage: string | null;
}

export interface StorageUsageInfo {
  localStorageSize: number;
  sessionStorageSize: number;
  totalSize: number;
  quota: number | null;
  usagePercentage: number;
}

export interface MobileCompatibilityState {
  browserInfo: MobileBrowserInfo;
  compatibility: MobileCompatibilityInfo;
  storageUsage: StorageUsageInfo;
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

// Parallel Execution Types
export interface Agent {
  id: string;
  name: string;
  type: 'task-executor' | 'code-reviewer' | 'qa-tester' | 'deployment-manager';
  status: 'idle' | 'running' | 'completed' | 'blocked' | 'error' | 'paused';
  currentTask?: string;
  performance: {
    tasksCompleted: number;
    averageExecutionTime: number;
    successRate: number;
  };
  lastActivity: Date;
  // Management properties
  isPaused?: boolean;
  isTerminated?: boolean;
  resourceUsage: {
    cpu: number; // percentage
    memory: number; // MB
    network: number; // KB/s
  };
  errors: AgentError[];
  configuration: AgentConfiguration;
  communicationStatus: 'connected' | 'disconnected' | 'error';
  contextSharing: {
    isSharing: boolean;
    sharedContexts: string[];
    lastShared: Date | null;
  };
}

export interface AgentError {
  id: string;
  timestamp: Date;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  stackTrace?: string;
  resolved: boolean;
}

export interface AgentConfiguration {
  maxConcurrentTasks: number;
  timeoutMinutes: number;
  retryAttempts: number;
  priority: 'low' | 'normal' | 'high';
  autoRestart: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface AgentActivity {
  id: string;
  agentId: string;
  timestamp: Date;
  action: 'started' | 'paused' | 'resumed' | 'completed' | 'error' | 'terminated';
  details?: string;
  duration?: number; // in seconds
}

export interface Workstream {
  id: string;
  name: string;
  description: string;
  agents: Agent[];
  status: 'pending' | 'running' | 'completed' | 'blocked';
  progress: number;
  dependencies: string[]; // IDs of dependent workstreams
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  priority: 'low' | 'medium' | 'high';
  estimatedDuration: number; // in minutes
  actualDuration?: number; // in minutes
}

export interface WorkstreamDependency {
  from: string;
  to: string;
  type: 'blocking' | 'sequential' | 'parallel';
}

export interface ParallelExecutionState {
  workstreams: Workstream[];
  agents: Agent[];
  dependencies: WorkstreamDependency[];
  lastUpdate: Date;
}

// GitHub Integration Types
export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  locked: boolean;
  assignees: GitHubUser[];
  labels: GitHubLabel[];
  milestone?: GitHubMilestone;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  user: GitHubUser;
  html_url: string;
  comments_url: string;
  events_url: string;
  labels_url: string;
  repository_url: string;
  assignee?: GitHubUser;
  assignees_url: string;
  comments: number;
  author_association: string;
  active_lock_reason?: string;
  body_html?: string;
  body_text?: string;
  timeline_url: string;
  performed_via_github_app?: boolean;
  state_reason?: string;
  draft?: boolean;
  reactions?: GitHubReactions;
  // Custom fields for local task linking
  linkedTaskId?: string;
  localStatus?: 'synced' | 'pending' | 'error';
  lastSyncAt?: Date;
}

export interface GitHubUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
}

export interface GitHubLabel {
  id: number;
  node_id: string;
  url: string;
  name: string;
  description?: string;
  color: string;
  default: boolean;
}

export interface GitHubMilestone {
  url: string;
  html_url: string;
  labels_url: string;
  id: number;
  node_id: string;
  number: number;
  title: string;
  description?: string;
  creator: GitHubUser;
  open_issues: number;
  closed_issues: number;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  due_on?: string;
  closed_at?: string;
}

export interface GitHubReactions {
  url: string;
  total_count: number;
  '+1': number;
  '-1': number;
  laugh: number;
  hooray: number;
  confused: number;
  heart: number;
  rocket: number;
  eyes: number;
}

export interface GitHubComment {
  id: number;
  node_id: string;
  url: string;
  html_url: string;
  body: string;
  user: GitHubUser;
  created_at: string;
  updated_at: string;
  issue_url: string;
  author_association: string;
  performed_via_github_app?: boolean;
  reactions?: GitHubReactions;
}

export interface GitHubIssueFormData {
  title: string;
  body: string;
  assignees?: string[];
  milestone?: number;
  labels?: string[];
  state?: 'open' | 'closed';
}

export interface GitHubSyncState {
  issues: GitHubIssue[];
  isLoading: boolean;
  error: string | null;
  lastSyncAt: Date | null;
  syncInProgress: boolean;
  filters: {
    state: 'all' | 'open' | 'closed';
    assignee: string | null;
    labels: string[];
    search: string;
  };
}

export interface GitHubConfig {
  repository: string;
  accessToken?: string;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
}

// Context Management Types
export interface ContextNode {
  id: string;
  name: string;
  description: string;
  type: 'task' | 'project' | 'goal' | 'agent' | 'workstream' | 'custom';
  content: string;
  metadata: {
    createdBy: string;
    createdAt: Date;
    lastModified: Date;
    version: number;
    tags: string[];
    priority: 'low' | 'medium' | 'high';
    status: 'active' | 'archived' | 'deprecated';
  };
  dependencies: string[]; // IDs of dependent context nodes
  permissions: {
    read: string[];
    write: string[];
    admin: string[];
  };
  performance: {
    accessCount: number;
    lastAccessed: Date;
    relevanceScore: number;
  };
}

export interface ContextRelationship {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  type: 'depends_on' | 'related_to' | 'part_of' | 'blocks' | 'enhances';
  strength: number; // 0-1 scale
  bidirectional: boolean;
  metadata: {
    createdBy: string;
    createdAt: Date;
    description?: string;
  };
}

export interface ContextSearchFilter {
  type?: ContextNode['type'];
  status?: ContextNode['metadata']['status'];
  priority?: ContextNode['metadata']['priority'];
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  createdBy?: string;
  searchTerm?: string;
}

export interface ContextVersion {
  id: string;
  contextNodeId: string;
  version: number;
  content: string;
  changes: string;
  createdBy: string;
  createdAt: Date;
  isMajorVersion: boolean;
}

export interface ContextExport {
  nodes: ContextNode[];
  relationships: ContextRelationship[];
  versions: ContextVersion[];
  metadata: {
    exportedAt: Date;
    exportedBy: string;
    version: string;
    description: string;
  };
}

export interface ContextPerformanceMetrics {
  totalNodes: number;
  activeNodes: number;
  averageAccessCount: number;
  mostAccessedNodes: ContextNode[];
  recentActivity: {
    nodeId: string;
    action: 'created' | 'modified' | 'accessed' | 'deleted';
    timestamp: Date;
    user: string;
  }[];
  storageUsage: {
    totalSize: number;
    nodeCount: number;
    averageNodeSize: number;
  };
}

export interface ContextState {
  nodes: ContextNode[];
  relationships: ContextRelationship[];
  versions: ContextVersion[];
  searchFilters: ContextSearchFilter;
  selectedNodes: string[];
  performanceMetrics: ContextPerformanceMetrics;
  isLoading: boolean;
  error: string | null;
}