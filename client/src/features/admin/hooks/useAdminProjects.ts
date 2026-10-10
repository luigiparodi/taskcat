import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import type { Project, ProjectStatus } from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";

const PAGE_SIZE = 12;

function message(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function useAdminProjects() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<ProjectStatus | "all">("all");
  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [membersFor, setMembersFor] = React.useState<Project | null>(null);
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<Project | null>(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  const query = React.useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch.trim() || undefined,
      status: status === "all" ? undefined : status,
    }),
    [page, debouncedSearch, status],
  );

  const projectsQuery = useQuery({
    queryKey: ["projects", query],
    queryFn: () => projectsApi.list(query),
  });

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: ["projects"] });
  }

  const setProjectStatus = useMutation({
    mutationFn: ({
      id,
      next,
    }: {
      id: string;
      next: "activate" | "deactivate";
    }) =>
      next === "activate"
        ? projectsApi.activate(id)
        : projectsApi.deactivate(id),
    onSuccess: invalidate,
  });

  const deleteProject = useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: async () => {
      setPendingDelete(null);
      await invalidate();
    },
  });

  const total = projectsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const projects = projectsQuery.data?.projects ?? [];

  const statusError = setProjectStatus.isError
    ? message(setProjectStatus.error, "Unable to update the project")
    : null;

  const loadError = projectsQuery.isError
    ? message(projectsQuery.error, "Unable to load projects")
    : null;

  const deleteError = deleteProject.isError
    ? message(deleteProject.error, "Unable to delete the project")
    : null;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (value: ProjectStatus | "all") => {
    setStatus(value);
    setPage(1);
  };

  const handlePreviousPage = () => setPage((current) => Math.max(1, current - 1));

  const handleNextPage = () => setPage((current) => Math.min(totalPages, current + 1));

  const handleRefresh = () => void projectsQuery.refetch();

  const handleCreateOpenChange = (next: boolean) => setCreateOpen(next);

  const handleCreated = (projectId: string) => navigate(`/projects/${projectId}`);

  const handleMembersOpenChange = (next: boolean) => {
    if (!next) {
      setMembersFor(null);
    }
  };

  const handleEditOpenChange = (next: boolean) => {
    if (!next) {
      setEditingProject(null);
    }
  };

  const handleDeleteOpenChange = (next: boolean) => {
    if (!next) {
      setPendingDelete(null);
    }
  };

  const handleConfirmDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (pendingDelete) {
      deleteProject.mutate(pendingDelete.id);
    }
  };

  return {
    search,
    handleSearchChange,
    status,
    handleStatusChange,
    page,
    total,
    totalPages,
    handlePreviousPage,
    handleNextPage,
    handleRefresh,
    projects,
    isPending: projectsQuery.isPending,
    isError: projectsQuery.isError,
    loadError,
    statusError,
    setProjectStatus,
    handleOpenCreate: () => setCreateOpen(true),
    createOpen,
    handleCreateOpenChange,
    handleCreated,
    membersFor,
    setMembersFor,
    handleMembersOpenChange,
    editingProject,
    setEditingProject,
    handleEditOpenChange,
    pendingDelete,
    setPendingDelete,
    handleDeleteOpenChange,
    deleteProject,
    deleteError,
    handleConfirmDelete,
  };
}

export type UseAdminProjectsReturn = ReturnType<typeof useAdminProjects>;