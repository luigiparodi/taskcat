import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";
import { ApiError } from "@/lib/api/client";

const TITLE_MIN = 3;
const TITLE_MAX = 100;
const DESCRIPTION_MAX = 2000;

type Errors = Partial<Record<"title" | "description" | "dates", string>>;

export type CreateProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (projectId: string) => void;
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

  return errors;
}

export function useCreateProject({
  open,
  onOpenChange,
  onCreated,
}: CreateProjectDialogProps) {
  const queryClient = useQueryClient();

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [clientName, setClientName] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [errors, setErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  function reset() {
    setTitle("");
    setDescription("");
    setClientName("");
    setStartDate("");
    setEndDate("");
    setErrors({});
    setFormError(null);
  }

  const createProject = useMutation({
    mutationFn: () =>
      projectsApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        clientName: clientName.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    onSuccess: async (project) => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      reset();
      onOpenChange(false);
      onCreated?.(project.id);
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiError ? error.message : "Unable to create the project",
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

    createProject.mutate();
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      reset();
    }
    onOpenChange(next);
  }

  return {
    open,
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
    isPending: createProject.isPending,
  };
}

export type UseCreateProjectReturn = ReturnType<typeof useCreateProject>;