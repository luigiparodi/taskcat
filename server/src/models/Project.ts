import { ObjectId } from 'mongodb';
import { getDb } from '../config/database';

export type ProjectStatus = 'active' | 'inactive';

export interface Project {
  _id?: ObjectId;
  title: string;
  description?: string;
  clientName?: string;
  status: ProjectStatus;
  reason?: string;
  startDate?: Date;
  endDate?: Date;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectMember {
  _id?: ObjectId;
  projectId: ObjectId;
  userId: ObjectId;
  role: 'admin' | 'member';
  joinedAt: Date;
}

const PROJECTS_COLLECTION = 'projects';
const PROJECT_MEMBERS_COLLECTION = 'project_members';

export function getProjectCollection() {
  return getDb().collection<Project>(PROJECTS_COLLECTION);
}

export function getProjectMemberCollection() {
  return getDb().collection<ProjectMember>(PROJECT_MEMBERS_COLLECTION);
}


