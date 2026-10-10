import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useAuth } from "@/features/auth/auth-context";
import type { ProjectStatus } from "@/lib/api/types";

const PAGE_SIZE = 12;

export function useProjects() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<ProjectStatus | "all">("all");
  const [page, setPage] = React.useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const query = React.useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch.trim() || undefined,
      status: status === "all" ? undefined : status,
    }),
    [page, debouncedSearch, status]
  );

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["projects", query],
    queryFn: () => projectsApi.list(query),
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const projects = data?.projects ?? [];
  const hasFilters = search.length > 0 || status !== "all";
  const errorMessage = error instanceof Error ? error.message : "Unable to load projects";

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

  const handleRefresh = () => void refetch();

  return {
    isAdmin,
    search,
    status,
    page,
    total,
    totalPages,
    projects,
    hasFilters,
    isPending,
    isError,
    errorMessage,
    handleSearchChange,
    handleStatusChange,
    handlePreviousPage,
    handleNextPage,
    handleRefresh,
  };
}

export type UseProjectsReturn = ReturnType<typeof useProjects>;