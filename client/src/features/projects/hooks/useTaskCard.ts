import * as React from "react";
import type { Task, TaskStatus } from "@/lib/api/types";

const STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "working", label: "Working" },
  { value: "finished", label: "Finished" },
];

const NO_ASSIGNEE = "Unassigned";

function formatDueDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export type TaskCardProps = {
  task: Task;
  canManage: boolean;
  pendingTaskId: string | null;
  memberNames: Map<string, string>;
  nowMs: number;
  onMove: (status: TaskStatus) => void;
  onOpenTask: () => void;
  currentUserId: string;
};

export function useTaskCard({
  task,
  canManage,
  pendingTaskId,
  memberNames,
  nowMs,
  onMove,
  onOpenTask,
  currentUserId,
}: TaskCardProps) {
  const moving = pendingTaskId === task.id;
  const isAssignee = task.assignedTo === currentUserId;
  const canMove = canManage || isAssignee;

  const isOverdue =
    task.status !== "finished" && task.endDate
      ? new Date(task.endDate).getTime() < nowMs
      : false;

  const assigneeName = task.assignedTo ? memberNames.get(task.assignedTo) : undefined;

  const currentLabel = React.useMemo(
    () => STATUS_OPTIONS.find((option) => option.value === task.status)?.label ?? task.status,
    [task.status]
  );

  const statusItems = React.useMemo(
    () =>
      STATUS_OPTIONS.map((option) => ({
        value: option.value,
        label: option.value === task.status ? option.label : `Move to ${option.label}`,
      })),
    [task.status]
  );

  const dueLabel = React.useMemo(
    () => (task.endDate ? formatDueDate(task.endDate) : null),
    [task.endDate]
  );

  const hoursLabel = React.useMemo(
    () => (task.estimatedHours ? `${task.estimatedHours}h` : null),
    [task.estimatedHours]
  );

  const moveLabel = `Move ${task.title} to another column`;

  function handleOpen() {
    onOpenTask();
  }

  function handleMove(status: string) {
    onMove(status as TaskStatus);
  }

  return {
    task,
    canManage,
    canMove,
    moving,
    isOverdue,
    assigneeName: assigneeName ?? NO_ASSIGNEE,
    currentLabel,
    statusItems,
    dueLabel,
    hoursLabel,
    moveLabel,
    handleOpen,
    handleMove,
  };
}

export type UseTaskCardReturn = ReturnType<typeof useTaskCard>;