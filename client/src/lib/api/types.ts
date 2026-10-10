export type UserRole = "admin" | "worker";
export type ProjectStatus = "active" | "inactive";
export type TaskStatus = "pending" | "working" | "finished";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Preferences {
  theme?: "light" | "dark";
  notifications?: boolean;
  timezone?: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  preferences: Preferences;
}

export interface SessionResult {
  id: string;
  email: string;
  token: string;
  refreshToken?: string;
  user: PublicUser;
}

export interface RefreshResult {
  token: string;
  refreshToken: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string | null;
  clientName?: string | null;
  status: ProjectStatus;
  reason?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListResult {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  endDate?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskBoard {
  pending: Task[];
  working: Task[];
  finished: Task[];
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  editedAt?: string | null;
}

export interface TaskLink {
  id: string;
  taskId: string;
  userId: string;
  url: string;
  title: string;
  description?: string | null;
  createdAt: string;
}

export interface TaskHistoryEntry {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
}

export interface ImportPreviewTask {
  title: string;
  description: string | null;
  priority: TaskPriority;
  assignedTo: string | null;
  suggestedAssignee: string | null;
  endDate: string | null;
  estimatedHours: number | null;
}

export interface ImportPreviewResult {
  preview: ImportPreviewTask[];
  sessionId: string;
}

export interface ImportCreateResult {
  created: number;
  tasks: Task[];
}

export interface ProjectMember {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  joinedAt: string;
}

export interface ProjectMembersResult {
  total: number;
  members: ProjectMember[];
}

export interface AdminOverview {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  openTasks: number;
  overdueTasks: number;
  activeMembers: number;
}

export interface TaskStatusCounts {
  pending: number;
  working: number;
  finished: number;
}

export interface MemberWorkload {
  userId: string;
  name: string;
  email: string;
  assignedTasks: number;
  openTasks: number;
  completedTasks: number;
  estimatedHours: number;
}

export interface ProjectAnalytics {
  projectId: string;
  title: string;
  status: ProjectStatus;
  totalTasks: number;
  pending: number;
  working: number;
  finished: number;
  progress: number;
}

export interface ActivityPoint {
  date: string;
  created: number;
}

export interface AdminAnalytics {
  overview: AdminOverview;
  taskStatus: TaskStatusCounts;
  workload: MemberWorkload[];
  projects: ProjectAnalytics[];
  activity: ActivityPoint[];
}