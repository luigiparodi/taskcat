import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/tasks";
import { ApiError } from "@/lib/api/client";
import type {
  ImportPreviewTask,
  ProjectMember,
  TaskPriority,
} from "@/lib/api/types";

const PRIORITIES: Array<{ value: TaskPriority; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const NO_ASSIGNEE = "unassigned";

export type ImportSource = "markdown" | "file";
export type ImportFileKind = "pdf" | "docx";

export function fileKindOf(file: File | null): ImportFileKind | null {
  if (!file) return null;
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".docx")) return "docx";
  return null;
}

export type ImportTasksDialogProps = {
  projectId: string;
  members: ProjectMember[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported?: (created: number) => void;
};

export function useImportTasks({
  projectId,
  members,
  open,
  onOpenChange,
  onImported,
}: ImportTasksDialogProps) {
  const queryClient = useQueryClient();
  const tasksKey = ["project-tasks", projectId] as const;

  const [source, setSource] = React.useState<ImportSource>("markdown");
  const [markdown, setMarkdown] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<ImportPreviewTask[] | null>(null);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);

  const fileKind = fileKindOf(file);

  function reset() {
    setSource("markdown");
    setMarkdown("");
    setFile(null);
    setPreview(null);
    setSessionId(null);
    setFormError(null);
  }

  const extractMutation = useMutation({
    mutationFn: () => {
      if (source === "markdown") {
        return tasksApi.importMarkdown(projectId, markdown.trim());
      }
      if (fileKind === "pdf") {
        return tasksApi.importPdf(projectId, file as File);
      }
      return tasksApi.importDocx(projectId, file as File);
    },
    onSuccess: (data) => {
      setPreview(data.preview);
      setSessionId(data.sessionId);
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      tasksApi.importCreate(projectId, sessionId as string, preview ?? []),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: tasksKey });
      onImported?.(data.created);
      reset();
      onOpenChange(false);
    },
  });

  function handleSourceChange(next: ImportSource) {
    setSource(next);
    setFormError(null);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setFormError(null);
  }

  function handleExtract() {
    setFormError(null);

    if (source === "markdown") {
      if (markdown.trim().length === 0) {
        setFormError("Paste a requirements document first");
        return;
      }
    } else if (!file) {
      setFormError("Choose a PDF or DOCX file");
      return;
    } else if (!fileKind) {
      setFormError("Only PDF and DOCX files are supported");
      return;
    }

    extractMutation.mutate();
  }

  function updatePreviewAt(index: number, patch: Partial<ImportPreviewTask>) {
    setPreview((current) => {
      if (!current) return current;
      return current.map((task, i) => (i === index ? { ...task, ...patch } : task));
    });
  }

  function removePreviewAt(index: number) {
    setPreview((current) => {
      if (!current) return null;
      const next = current.filter((_, i) => i !== index);
      return next.length === 0 ? null : next;
    });
  }

  function handleCreate() {
    if (!preview || preview.length === 0) return;
    createMutation.mutate();
  }

  function handleStartOver() {
    setPreview(null);
    setSessionId(null);
    setFormError(null);
  }

  const isServiceBusy =
    extractMutation.error instanceof ApiError &&
    extractMutation.error.status === 503;

  const extractError = extractMutation.error
    ? extractMutation.error instanceof ApiError
      ? extractMutation.error.message
      : "Unable to analyze the document"
    : formError;

  const createError = createMutation.error
    ? createMutation.error instanceof ApiError
      ? createMutation.error.message
      : "Unable to create the tasks"
    : null;

  return {
    open,
    onOpenChange,
    members,
    PRIORITIES,
    NO_ASSIGNEE,
    source,
    handleSourceChange,
    markdown,
    setMarkdown,
    file,
    fileKind,
    handleFileChange,
    preview,
    sessionId,
    extractError,
    isServiceBusy,
    createError,
    isExtracting: extractMutation.isPending,
    isCreating: createMutation.isPending,
    canCreate: Boolean(preview && preview.length > 0),
    handleExtract,
    handleCreate,
    handleStartOver,
    updatePreviewAt,
    removePreviewAt,
  };
}

export type UseImportTasksReturn = ReturnType<typeof useImportTasks>;