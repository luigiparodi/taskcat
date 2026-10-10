import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (error instanceof Error && 'isUnauthorized' in error) {
          const apiError = error as Error & Record<string, unknown>;
          if (apiError.isUnauthorized || apiError.isForbidden || apiError.isNotFound) return false;
          if (apiError.isValidation) return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});
