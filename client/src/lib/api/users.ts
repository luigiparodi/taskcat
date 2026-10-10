import { api, buildQuery } from "@/lib/api/client";
import type { PublicUser, UserRole } from "@/lib/api/types";

export interface UserListFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
}

export interface UserListResult {
  users: PublicUser[];
  total: number;
  page: number;
  limit: number;
}

export interface UserUpdateInput {
  name?: string;
  avatar_url?: string;
  timezone?: string;
}

export const usersApi = {
  list(filters: UserListFilters = {}) {
    return api.get<UserListResult>(`/users${buildQuery({ ...filters })}`);
  },
  update(userId: string, input: UserUpdateInput) {
    return api.put<PublicUser>(`/users/${userId}`, input);
  },
  updateRole(userId: string, role: UserRole) {
    return api.patch<PublicUser>(`/users/${userId}/role`, { role });
  },
  remove(userId: string) {
    return api.delete<{ success?: boolean }>(`/users/${userId}`);
  },
};