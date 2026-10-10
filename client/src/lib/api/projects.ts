import { api, buildQuery } from "@/lib/api/client";
import type {
  Project,
  ProjectListResult,
  ProjectMembersResult,
  ProjectStatus,
} from "@/lib/api/types";

export interface ProjectListFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProjectStatus;
}

export interface AvailableUsersFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export interface AvailableUsersResult {
  users: Array<{ id: string; name: string; email: string; avatarUrl?: string | null }>;
  total: number;
  page: number;
  limit: number;
}

export interface ProjectCreateInput {
  title: string;
  description?: string;
  clientName?: string;
  startDate?: string;
  endDate?: string;
}

export const projectsApi = {
  list(filters: ProjectListFilters = {}) {
    return api.get<ProjectListResult>(`/projects${buildQuery({ ...filters })}`);
  },
  get(projectId: string) {
    return api.get<Project>(`/projects/${projectId}`);
  },
  create(input: ProjectCreateInput) {
    return api.post<Project>("/projects", input);
  },
  update(projectId: string, input: Partial<ProjectCreateInput>) {
    return api.put<Project>(`/projects/${projectId}`, input);
  },
  remove(projectId: string) {
    return api.delete<{ success?: boolean }>(`/projects/${projectId}`);
  },
  activate(projectId: string) {
    return api.post<Project>(`/projects/${projectId}/activate`);
  },
  deactivate(projectId: string) {
    return api.post<Project>(`/projects/${projectId}/deactivate`);
  },
  members(projectId: string) {
    return api.get<ProjectMembersResult>(`/projects/${projectId}/members`);
  },
  availableUsers(projectId: string, filters: AvailableUsersFilters = {}) {
    return api.get<AvailableUsersResult>(`/projects/${projectId}/available-users${buildQuery({ ...filters })}`);
  },
  addMembers(projectId: string, userIds: string[]) {
    return api.post<ProjectMembersResult>(`/projects/${projectId}/members`, { userIds });
  },
  removeMember(projectId: string, userId: string) {
    return api.delete<{ success?: boolean }>(`/projects/${projectId}/members/${userId}`);
  },
};