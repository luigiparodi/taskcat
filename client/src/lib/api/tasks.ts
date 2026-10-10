import { api, buildQuery } from "@/lib/api/client";
import type {
  ImportCreateResult,
  ImportPreviewResult,
  ImportPreviewTask,
  Task,
  TaskBoard,
  TaskComment,
  TaskHistoryEntry,
  TaskLink,
  TaskPriority,
  TaskStatus,
} from "@/lib/api/types";

interface TaskListFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to?: string;
  search?: string;
}

interface TaskWriteInput {
  title?: string;
  description?: string;
  assigned_to?: string | null;
  priority?: TaskPriority;
  end_date?: string | null;
  estimated_hours?: number | null;
}

export const tasksApi = {
  list(projectId: string, filters: TaskListFilters = {}) {
    return api.get<TaskBoard>(
      `/projects/${projectId}/tasks${buildQuery({ ...filters })}`
    );
  },
  get(projectId: string, taskId: string) {
    return api.get<Task>(`/projects/${projectId}/tasks/${taskId}`);
  },
  create(projectId: string, input: TaskWriteInput & { title: string }) {
    return api.post<Task>(`/projects/${projectId}/tasks`, input);
  },
  update(projectId: string, taskId: string, input: TaskWriteInput) {
    return api.put<Task>(`/projects/${projectId}/tasks/${taskId}`, input);
  },
  remove(projectId: string, taskId: string) {
    return api.delete<{ success?: boolean }>(`/projects/${projectId}/tasks/${taskId}`);
  },
  setStatus(projectId: string, taskId: string, status: TaskStatus) {
    return api.patch<Task>(`/projects/${projectId}/tasks/${taskId}/status`, { status });
  },
  bulkCreate(projectId: string, tasks: Array<TaskWriteInput & { title: string }>) {
    return api.post<{ tasks: Task[] }>(`/projects/${projectId}/tasks/bulk`, { tasks });
  },
  history(projectId: string, taskId: string, limit?: number) {
    return api.get<TaskHistoryEntry[]>(
      `/projects/${projectId}/tasks/${taskId}/history${buildQuery({ limit })}`
    );
  },
  comments(projectId: string, taskId: string) {
    return api.get<TaskComment[]>(`/projects/${projectId}/tasks/${taskId}/comments`);
  },
  addComment(projectId: string, taskId: string, content: string) {
    return api.post<TaskComment>(`/projects/${projectId}/tasks/${taskId}/comments`, { content });
  },
  removeComment(projectId: string, taskId: string, commentId: string) {
    return api.delete<{ success?: boolean }>(
      `/projects/${projectId}/tasks/${taskId}/comments/${commentId}`
    );
  },
  links(projectId: string, taskId: string) {
    return api.get<TaskLink[]>(`/projects/${projectId}/tasks/${taskId}/links`);
  },
  addLink(projectId: string, taskId: string, input: { url: string; title: string; description?: string }) {
    return api.post<TaskLink>(`/projects/${projectId}/tasks/${taskId}/links`, input);
  },
  removeLink(projectId: string, taskId: string, linkId: string) {
    return api.delete<{ success?: boolean }>(
      `/projects/${projectId}/tasks/${taskId}/links/${linkId}`
    );
  },
  importMarkdown(projectId: string, markdown: string) {
    return api.post<ImportPreviewResult>(
      `/projects/${projectId}/tasks/import/markdown`,
      { markdown }
    );
  },
  importPdf(projectId: string, file: File) {
    return api.post<ImportPreviewResult>(
      `/projects/${projectId}/tasks/import/pdf`,
      fileForm(file)
    );
  },
  importDocx(projectId: string, file: File) {
    return api.post<ImportPreviewResult>(
      `/projects/${projectId}/tasks/import/docx`,
      fileForm(file)
    );
  },
  importCreate(projectId: string, sessionId: string, tasks: ImportPreviewTask[]) {
    return api.post<ImportCreateResult>(
      `/projects/${projectId}/tasks/import/create`,
      { sessionId, tasks }
    );
  },
};

function fileForm(file: File) {
  const form = new FormData();
  form.append("file", file);
  return form;
}