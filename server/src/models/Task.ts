import { ObjectId } from 'mongodb';
import { getDb } from '../config/database';

export type TaskStatus = 'pending' | 'working' | 'finished';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  _id?: ObjectId;
  projectId: ObjectId;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: ObjectId | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  endDate?: Date | null;
  completedAt?: Date | null;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskComment {
  _id?: ObjectId;
  taskId: ObjectId;
  userId: ObjectId;
  content: string;
  createdAt: Date;
  editedAt?: Date | null;
}

export interface TaskLink {
  _id?: ObjectId;
  taskId: ObjectId;
  userId: ObjectId;
  url: string;
  title: string;
  description?: string;
  createdAt: Date;
}

export interface TaskHistoryEntry {
  _id?: ObjectId;
  taskId: ObjectId;
  userId: ObjectId;
  action: string;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: Date;
}

const TASKS_COLLECTION = 'tasks';
const TASK_COMMENTS_COLLECTION = 'task_comments';
const TASK_LINKS_COLLECTION = 'task_links';
const TASK_HISTORY_COLLECTION = 'task_history';

export function getTaskCollection() {
  return getDb().collection<Task>(TASKS_COLLECTION);
}

export function getTaskCommentCollection() {
  return getDb().collection<TaskComment>(TASK_COMMENTS_COLLECTION);
}

export function getTaskLinkCollection() {
  return getDb().collection<TaskLink>(TASK_LINKS_COLLECTION);
}

export function getTaskHistoryCollection() {
  return getDb().collection<TaskHistoryEntry>(TASK_HISTORY_COLLECTION);
}


