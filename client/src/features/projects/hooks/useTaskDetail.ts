import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/tasks";
import { ApiError } from "@/lib/api/client";
import type { Task, TaskPriority } from "@/lib/api/types";

const PRIORITIES: Array<{ value: TaskPriority; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const TITLE_MIN = 3;
const TITLE_MAX = 150;
const NO_ASSIGNEE = "unassigned";

function errorText(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export type TaskDetailDialogProps = {
  projectId: string;
  task: Task;
  canManage: boolean;
  currentUserId: string;
  memberNames: Map<string, string>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function useTaskDetail({
  projectId,
  task,
  canManage,
  currentUserId,
  memberNames,
  open,
  onOpenChange,
}: TaskDetailDialogProps) {
  const queryClient = useQueryClient();
  const commentKey = ["task-comments", projectId, task.id] as const;
  const linkKey = ["task-links", projectId, task.id] as const;
  const historyKey = ["task-history", projectId, task.id] as const;
  const tasksKey = ["project-tasks", projectId] as const;

  const [commentText, setCommentText] = React.useState("");
  const [linkUrl, setLinkUrl] = React.useState("");
  const [linkTitle, setLinkTitle] = React.useState("");
  const [editing, setEditing] = React.useState(false);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priority, setPriority] = React.useState<TaskPriority>("medium");
  const [assignee, setAssignee] = React.useState(NO_ASSIGNEE);
  const [endDate, setEndDate] = React.useState("");
  const [estimatedHours, setEstimatedHours] = React.useState("");
  const [titleError, setTitleError] = React.useState<string | undefined>();

  const isAssignee = Boolean(task.assignedTo) && task.assignedTo === currentUserId;
  const canUpdate = canManage || isAssignee;

  const nameOf = React.useCallback(
    (userId: string) => memberNames.get(userId) ?? "Unknown member",
    [memberNames]
  );

  function startEditing() {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setPriority(task.priority);
    setAssignee(task.assignedTo ?? NO_ASSIGNEE);
    setEndDate(task.endDate ? task.endDate.slice(0, 10) : "");
    setEstimatedHours(
      task.estimatedHours === null || task.estimatedHours === undefined
        ? ""
        : String(task.estimatedHours)
    );
    setTitleError(undefined);
    setEditing(true);
  }

  const updateMutation = useMutation({
    mutationFn: () =>
      tasksApi.update(projectId, task.id, {
        title: title.trim(),
        description: description.trim(),
        priority,
        estimated_hours: estimatedHours ? Number(estimatedHours) : null,
        end_date: endDate || null,
        ...(canManage ? { assigned_to: assignee === NO_ASSIGNEE ? null : assignee } : {}),
      }),
    onSuccess: () => {
      setEditing(false);
      void queryClient.invalidateQueries({ queryKey: tasksKey });
      void queryClient.invalidateQueries({ queryKey: historyKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.remove(projectId, task.id),
    onSuccess: () => {
      setConfirmingDelete(false);
      void queryClient.invalidateQueries({ queryKey: tasksKey });
      onOpenChange(false);
    },
  });

  const comments = useQuery({
    queryKey: commentKey,
    queryFn: () => tasksApi.comments(projectId, task.id),
    enabled: open,
  });

  const links = useQuery({
    queryKey: linkKey,
    queryFn: () => tasksApi.links(projectId, task.id),
    enabled: open,
  });

  const history = useQuery({
    queryKey: historyKey,
    queryFn: () => tasksApi.history(projectId, task.id),
    enabled: open,
  });

  const addComment = useMutation({
    mutationFn: () => tasksApi.addComment(projectId, task.id, commentText.trim()),
    onSuccess: () => {
      setCommentText("");
      void queryClient.invalidateQueries({ queryKey: commentKey });
    },
  });

  const removeComment = useMutation({
    mutationFn: (commentId: string) => tasksApi.removeComment(projectId, task.id, commentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commentKey });
    },
  });

  const addLink = useMutation({
    mutationFn: () =>
      tasksApi.addLink(projectId, task.id, {
        url: linkUrl.trim(),
        title: linkTitle.trim(),
      }),
    onSuccess: () => {
      setLinkUrl("");
      setLinkTitle("");
      void queryClient.invalidateQueries({ queryKey: linkKey });
    },
  });

  const removeLink = useMutation({
    mutationFn: (linkId: string) => tasksApi.removeLink(projectId, task.id, linkId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: linkKey });
    },
  });

  function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < TITLE_MIN || trimmedTitle.length > TITLE_MAX) {
      setTitleError(`Title must be ${TITLE_MIN}-${TITLE_MAX} characters`);
      return;
    }
    setTitleError(undefined);
    updateMutation.mutate();
  }

  function handleCommentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (commentText.trim().length === 0) return;
    addComment.mutate();
  }

  function handleLinkSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (linkUrl.trim().length === 0 || linkTitle.trim().length === 0) return;
    addLink.mutate();
  }

  function handlePriorityChange(value: string) {
    setPriority(value as TaskPriority);
  }

  function handleConfirmingDeleteChange(next: boolean) {
    if (!next) setConfirmingDelete(false);
  }

  function confirmDelete() {
    deleteMutation.mutate();
  }

  const commentItems = comments.data ?? [];
  const linkItems = links.data ?? [];
  const historyItems = history.data ?? [];

  const editError = updateMutation.error
    ? updateMutation.error instanceof ApiError
      ? updateMutation.error.message
      : "Unable to save the task"
    : null;

  const addCommentError = addComment.error
    ? errorText(addComment.error, "Unable to add the comment")
    : null;

  const addLinkError = addLink.error ? errorText(addLink.error, "Unable to add the link") : null;

  const commentsError = comments.isError
    ? errorText(comments.error, "Unable to load comments")
    : null;

  const linksError = links.isError ? errorText(links.error, "Unable to load links") : null;

  const historyError = history.isError
    ? errorText(history.error, "Unable to load history")
    : null;

  const deleteError = deleteMutation.error
    ? deleteMutation.error instanceof ApiError
      ? deleteMutation.error.message
      : "Unable to delete the task"
    : null;

  return {
    task,
    canManage,
    currentUserId,
    memberNames,
    open,
    onOpenChange,
    canUpdate,
    nameOf,
    PRIORITIES,
    NO_ASSIGNEE,
    editing,
    setEditing,
    startEditing,
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
    handleEditSubmit,
    updateMutation,
    editError,
    comments,
    commentsError,
    commentItems,
    commentText,
    setCommentText,
    handleCommentSubmit,
    addComment,
    addCommentError,
    removeComment,
    links,
    linksError,
    linkItems,
    linkUrl,
    setLinkUrl,
    linkTitle,
    setLinkTitle,
    handleLinkSubmit,
    addLink,
    addLinkError,
    removeLink,
    history,
    historyError,
    historyItems,
    confirmingDelete,
    setConfirmingDelete,
    handleConfirmingDeleteChange,
    confirmDelete,
    deleteMutation,
    deleteError,
  };
}

export type UseTaskDetailReturn = ReturnType<typeof useTaskDetail>;