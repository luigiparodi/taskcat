import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics";
import { ApiError } from "@/lib/api/client";

function message(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function useAdminAnalytics() {
  const analyticsQuery = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => analyticsApi.get(),
  });

  const loadError = analyticsQuery.isError
    ? message(analyticsQuery.error, "Unable to load analytics")
    : null;

  const handleRefresh = () => void analyticsQuery.refetch();

  return {
    analytics: analyticsQuery.data ?? null,
    isPending: analyticsQuery.isPending,
    isError: analyticsQuery.isError,
    loadError,
    handleRefresh,
  };
}

export type UseAdminAnalyticsReturn = ReturnType<typeof useAdminAnalytics>;