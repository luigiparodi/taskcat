import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api/users";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { ApiError } from "@/lib/api/client";
import type { PublicUser, UserRole } from "@/lib/api/types";
import { useAuth } from "@/features/auth/auth-context";

const PAGE_SIZE = 20;

function message(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function useAdminUsers() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [role, setRole] = React.useState<UserRole | "all">("all");
  const [page, setPage] = React.useState(1);
  const [editing, setEditing] = React.useState<PublicUser | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<PublicUser | null>(null);
  const [pendingRoleChange, setPendingRoleChange] = React.useState<PublicUser | null>(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  const query = React.useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch.trim() || undefined,
      role: role === "all" ? undefined : role,
    }),
    [page, debouncedSearch, role]
  );

  const usersQuery = useQuery({
    queryKey: ["users", query],
    queryFn: () => usersApi.list(query),
  });

  const removeUser = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: async () => {
      setPendingDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => usersApi.updateRole(id, role),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const total = usersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const users = usersQuery.data?.users ?? [];

  const removeError = removeUser.isError
    ? message(removeUser.error, "Unable to delete this user")
    : null;

  const roleChangeError = changeRole.isError
    ? message(changeRole.error, "Unable to change this user's role")
    : null;

  const loadError = usersQuery.isError ? message(usersQuery.error, "Unable to load users") : null;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleRoleChange = (value: UserRole | "all") => {
    setRole(value);
    setPage(1);
  };

  const handlePreviousPage = () => setPage((current) => Math.max(1, current - 1));

  const handleNextPage = () => setPage((current) => Math.min(totalPages, current + 1));

  const handleRefresh = () => void usersQuery.refetch();

  return {
    currentUserId: currentUser?.id,
    search,
    handleSearchChange,
    role,
    handleRoleChange,
    page,
    total,
    totalPages,
    handlePreviousPage,
    handleNextPage,
    editing,
    setEditing,
    pendingDelete,
    setPendingDelete,
    pendingRoleChange,
    setPendingRoleChange,
    changeRole,
    users,
    isPending: usersQuery.isPending,
    isError: usersQuery.isError,
    loadError,
    handleRefresh,
    removeUser,
    removeError,
    roleChangeError,
  };
}

export type UseAdminUsersReturn = ReturnType<typeof useAdminUsers>;