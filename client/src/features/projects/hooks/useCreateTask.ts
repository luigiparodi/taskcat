import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/tasks";
import { ApiError } from "@/lib/api/client";
import type { ProjectMember, Task, TaskPriority } from "@/lib/api/types";

const PRIORITIES: Array<{ value: TaskPriority; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const TITLE_MIN = 3;
const TITLE_MAX = 150;

const NO_ASSIGNEE = "unassigned";

export type CreateTaskDialogProps = {
  projectId: string;
  members: ProjectMember[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (task: Task) => void;
};

export function useCreateTask({
  projectId,
  members,
  open,
  onOpenChange,
  onCreated,
}: CreateTaskDialogProps) {
  const queryClient = useQueryClient();
  const tasksKey = ["project-tasks", projectId] as const;

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priority, setPriority] = React.useState<TaskPriority>("medium");
  const [assignee, setAssignee] = React.useState(NO_ASSIGNEE);
  const [endDate, setEndDate] = React.useState("");
  const [estimatedHours, setEstimatedHours] = React.useState("");
  const [titleError, setTitleError] = React.useState<string | undefined>();
  const [formError, setFormError] = React.useState<string | null>(null);

  function reset() {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setAssignee(NO_ASSIGNEE);
    setEndDate("");
    setEstimatedHours("");
    setTitleError(undefined);
    setFormError(null);
  }

  const createMutation = useMutation({
    mutationFn: () =>
      tasksApi.create(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        assigned_to: assignee === NO_ASSIGNEE ? null : assignee,
        end_date: endDate || undefined,
        estimated_hours: estimatedHours ? Number(estimatedHours) : undefined,
      }),
    onSuccess: (created) => {
      reset();
      onOpenChange(false);
      void queryClient.invalidateQueries({ queryKey: tasksKey });
      onCreated?.(created);
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < TITLE_MIN) {
      setTitleError(`Title must be at least ${TITLE_MIN} characters`);
      return;
    }
    if (trimmedTitle.length > TITLE_MAX) {
      setTitleError(`Title must be at most ${TITLE_MAX} characters`);
      return;
    }
    setTitleError(undefined);
    createMutation.mutate();
  }

  function handleCancel() {
    onOpenChange(false);
  }

  function handlePriorityChange(value: string) {
    setPriority(value as TaskPriority);
  }

  const errorMessage = createMutation.error
    ? createMutation.error instanceof ApiError
      ? createMutation.error.message
      : "Unable to create the task"
    : formError;

  return {
    open,
    onOpenChange,
    members,
    PRIORITIES,
    NO_ASSIGNEE,
    title,
    setTitle,
    description,
    setDescription,
    priority,
    handlePriorityChange,
    assignee,
    setAssignee,
    endDate,
    setEndDate,
    estimatedHours,
    setEstimatedHours,
    titleError,
    errorMessage,
    isPending: createMutation.isPending,
    handleSubmit,
    handleCancel,
  };
}

export type UseCreateTaskReturn = ReturnType<typeof useCreateTask>;
