import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";
import { ApiError } from "@/lib/api/client";
import type { Project } from "@/lib/api/types";

const TITLE_MIN = 3;
const TITLE_MAX = 100;
const DESCRIPTION_MAX = 2000;

type Errors = Partial<Record<"title" | "description" | "dates", string>>;

export type EditProjectDialogProps = {
  project: Project | null;
  onOpenChange: (open: boolean) => void;
  onEdited?: () => void;
};

function validate(values: {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
}): Errors {
  const errors: Errors = {};
  const title = values.title.trim();

  if (title.length === 0) {
    errors.title = "Give the project a title";
  } else if (title.length < TITLE_MIN) {
    errors.title = `Title must be at least ${TITLE_MIN} characters`;
  } else if (title.length > TITLE_MAX) {
    errors.title = `Title must be at most ${TITLE_MAX} characters`;
  }

  if (values.description.length > DESCRIPTION_MAX) {
    errors.description = `Description must be at most ${DESCRIPTION_MAX} characters`;
  }

  if (values.startDate && values.endDate && values.endDate < values.startDate) {
    errors.dates = "End date cannot be before start date";
  }

  // Check if end date is in the past using LOCAL time (user's timezone)
  // This matches user expectations - for a user in Perú at 11PM on Oct 6,
  // selecting Oct 7 should be valid since it's tomorrow locally.
  // Parse YYYY-MM-DD as local midnight (NOT new Date("YYYY-MM-DD") which is UTC).
  if (values.endDate) {
    const [y, m, d] = values.endDate.split("-").map(Number);
    const selectedEndDate = new Date(y, m - 1, d);
    const todayLocal = new Date();
    // Set today to midnight of the current day in local time
    todayLocal.setHours(0, 0, 0, 0);
    if (selectedEndDate < todayLocal) {
      errors.dates = "End date cannot be in the past";
    }
  }

  return errors;
}

export function useEditProject({
  project,
  onOpenChange,
  onEdited,
}: EditProjectDialogProps) {
  const queryClient = useQueryClient();

  const [title, setTitle] = React.useState(project?.title ?? "");
  const [description, setDescription] = React.useState(project?.description ?? "");
  const [clientName, setClientName] = React.useState(project?.clientName ?? "");
  const [startDate, setStartDate] = React.useState(project?.startDate ? project.startDate.substring(0, 10) : "");
  const [endDate, setEndDate] = React.useState(project?.endDate ? project.endDate.substring(0, 10) : "");
  const [errors, setErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  const editProject = useMutation({
    mutationFn: () => {
      if (!project) throw new Error("No project selected");
      return projectsApi.update(project.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        clientName: clientName.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      onOpenChange(false);
      onEdited?.();
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiError ? error.message : "Unable to update the project",
      );
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate({ title, description, startDate, endDate });
    setErrors(nextErrors);
    setFormError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    editProject.mutate();
  }

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
  }

  return {
    open: project !== null,
    handleOpenChange,
    handleSubmit,
    title,
    setTitle,
    description,
    setDescription,
    clientName,
    setClientName,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    errors,
    formError,
    isPending: editProject.isPending,
  };
}

export type UseEditProjectReturn = ReturnType<typeof useEditProject>;
