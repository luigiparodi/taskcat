import * as React from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";
import { tasksApi } from "@/lib/api/tasks";
import { ApiError } from "@/lib/api/client";
import type { Task, TaskBoard, TaskStatus } from "@/lib/api/types";
import { useAuth } from "@/features/auth/auth-context";

const COLUMNS: Array<{ status: TaskStatus; title: string }> = [
  { status: "pending", title: "Pending" },
  { status: "working", title: "Working" },
  { status: "finished", title: "Finished" },
];

const EMPTY_BOARD: TaskBoard = { pending: [], working: [], finished: [] };

function moveTask(board: TaskBoard, taskId: string, status: TaskStatus): TaskBoard {
  let moving: Task | undefined;
  const rest = { ...board };

  for (const key of Object.keys(rest) as Array<keyof TaskBoard>) {
    const found = rest[key].find((task) => task.id === taskId);
    if (found) {
      moving = found;
      rest[key] = rest[key].filter((task) => task.id !== taskId);
    }
  }

  if (!moving) return board;

  return { ...rest, [status]: [moving, ...rest[status]] };
}

export function useBoard() {
  const { projectId = "" } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const taskQueryKey = ["project-tasks", projectId] as const;

  const [pendingTaskId, setPendingTaskId] = React.useState<string | null>(null);
  const [moveError, setMoveError] = React.useState<string | null>(null);
  const [importNotice, setImportNotice] = React.useState<string | null>(null);
  const importNoticeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleImported = React.useCallback((count: number) => {
    setImportNotice(
      `Imported ${count} ${count === 1 ? "task" : "tasks"} from the document.`
    );
    if (importNoticeTimer.current) {
      clearTimeout(importNoticeTimer.current);
    }
    importNoticeTimer.current = setTimeout(() => setImportNotice(null), 6000);
  }, []);

  React.useEffect(() => {
    return () => {
      if (importNoticeTimer.current) {
        clearTimeout(importNoticeTimer.current);
      }
    };
  }, []);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [openTaskId, setOpenTaskId] = React.useState<string | null>(null);
  const [nowMs] = React.useState(() => Date.now());

  const project = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectsApi.get(projectId),
    enabled: Boolean(projectId),
  });

  const board = useQuery({
    queryKey: taskQueryKey,
    queryFn: () => tasksApi.list(projectId),
    enabled: Boolean(projectId),
  });

  const members = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: () => projectsApi.members(projectId),
    enabled: Boolean(projectId),
  });

  const memberNames = React.useMemo(() => {
    const names = new Map<string, string>();
    for (const member of members.data?.members ?? []) {
      names.set(member.id, member.name);
    }
    return names;
  }, [members.data]);

  const isProjectAdmin = React.useMemo(() => {
    if (!user) return false;
    const own = (members.data?.members ?? []).find((member) => member.id === user.id);
    return own?.role === "admin";
  }, [members.data, user]);

  const canManageTasks = user?.role === "admin" || isProjectAdmin;

  const moveMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      tasksApi.setStatus(projectId, taskId, status),
    onMutate: async ({ taskId, status }) => {
      setMoveError(null);
      setPendingTaskId(taskId);
      await queryClient.cancelQueries({ queryKey: taskQueryKey });
      const previous = queryClient.getQueryData<TaskBoard>(taskQueryKey);
      if (previous) {
        queryClient.setQueryData<TaskBoard>(taskQueryKey, moveTask(previous, taskId, status));
      }
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData<TaskBoard>(taskQueryKey, context.previous);
      }
      setMoveError(error instanceof ApiError ? error.message : "Unable to move that task");
    },
    onSettled: () => {
      setPendingTaskId(null);
      void queryClient.invalidateQueries({ queryKey: taskQueryKey });
    },
  });

  const columns = board.data ?? EMPTY_BOARD;
  const openTask = openTaskId
    ? COLUMNS.flatMap((column) => columns[column.status]).find((task) => task.id === openTaskId)
    : undefined;
  const totalTasks = COLUMNS.reduce((sum, column) => sum + columns[column.status].length, 0);

  return {
    projectId,
    project,
    board,
    members,
    memberNames,
    canManageTasks,
    moveError,
    importNotice,
    handleImported,
    createOpen,
    setCreateOpen,
    openTaskId,
    setOpenTaskId,
    pendingTaskId,
    nowMs,
    openTask,
    totalTasks,
    columns,
    COLUMNS,
    EMPTY_BOARD,
    moveMutation,
    isProjectAdmin,
    user,
  };
}

export type UseBoardReturn = ReturnType<typeof useBoard>;
