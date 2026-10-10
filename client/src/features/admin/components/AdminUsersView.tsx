import { Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { UserRole } from "@/lib/api/types";
import type { useAdminUsers } from "@/features/admin/hooks/useAdminUsers";

const ROLE_FILTERS: Array<{ label: string; value: UserRole | "all" }> = [
  { label: "All", value: "all" },
  { label: "Admins", value: "admin" },
  { label: "Workers", value: "worker" },
];

type AdminUsersViewProps = ReturnType<typeof useAdminUsers>;

export function AdminUsersView({
  currentUserId,
  search,
  handleSearchChange,
  role,
  handleRoleChange,
  page,
  total,
  totalPages,
  handlePreviousPage,
  handleNextPage,
  setEditing,
  setPendingDelete,
  setPendingRoleChange,
  users,
  isPending,
  isError,
  loadError,
  handleRefresh,
  removeError,
  roleChangeError,
}: AdminUsersViewProps) {
  const actionError = removeError ?? roleChangeError;
  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <Field className="max-w-xs">
          <FieldLabel>Search</FieldLabel>
          <Input
            type="search"
            placeholder="Find a user by name or email"
            startIcon={<Search />}
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
          />
        </Field>

        <div role="group" aria-label="Filter by role" className="flex gap-2">
          {ROLE_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              size="sm"
              variant={role === filter.value ? "secondary" : "ghost"}
              aria-pressed={role === filter.value}
              onClick={() => handleRoleChange(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {actionError ? (
        <p
          role="alert"
          className="mb-4 rounded-box border border-danger-border bg-danger-subtle px-3 py-2 text-caption font-medium text-danger"
        >
          {actionError}
        </p>
      ) : null}

      {isPending ? (
        <p role="status" className="text-body text-muted-foreground">
          Loading users...
        </p>
      ) : isError ? (
        <div className="flex flex-col items-start gap-3 rounded-card border border-danger-border bg-danger-subtle p-4">
          <p role="alert" className="text-body font-medium text-danger">
            {loadError}
          </p>
          <Button size="sm" variant="outline" onClick={handleRefresh}>
            Try again
          </Button>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-border-strong px-6 py-16 text-center">
          <Users aria-hidden="true" className="size-6 text-muted-foreground" />
          <p className="text-body font-medium">No users found</p>
          <p className="text-caption text-muted-foreground">
            {search || role !== "all" ? "Try a different search or filter." : "No users yet."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            return (
              <li
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface-1 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-body font-medium">
                    {user.name}
                    {isSelf ? <span className="text-muted-foreground"> (you)</span> : null}
                  </p>
                  <p className="truncate text-caption text-muted-foreground">{user.email}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={user.role === "admin" ? "info" : "neutral"} dot>
                    {user.role === "admin" ? "Admin" : "Worker"}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => setEditing(user)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPendingRoleChange(user)}
                  >
                    {user.role === "admin" ? "Make worker" : "Make admin"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger hover:text-danger"
                    disabled={isSelf}
                    title={isSelf ? "You cannot delete your own account" : undefined}
                    onClick={() => setPendingDelete(user)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 ? (
        <nav aria-label="Pagination" className="mt-8 flex items-center justify-between gap-4">
          <p className="text-caption text-muted-foreground">
            Page {page} of {totalPages} - {total} users
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={handlePreviousPage}>
              Previous
            </Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={handleNextPage}>
              Next
            </Button>
          </div>
        </nav>
      ) : null}
    </>
  );
}