import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CirclePause,
  CirclePlay,
  FolderKanban,
  Pencil,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ProjectStatus } from "@/lib/api/types";
import type { useAdminProjects } from "@/features/admin/hooks/useAdminProjects";

const FILTERS: Array<{ label: string; value: ProjectStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

type AdminProjectsViewProps = ReturnType<typeof useAdminProjects>;

export function AdminProjectsView({
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
  isPending,
  isError,
  loadError,
  statusError,
  setProjectStatus,
  handleOpenCreate,
  setMembersFor,
  setEditingProject,
  setPendingDelete,
}: AdminProjectsViewProps) {
  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <Field className="max-w-xs">
          <FieldLabel>Search</FieldLabel>
          <Input
            type="search"
            placeholder="Find a project"
            startIcon={<Search />}
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
          />
        </Field>

        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label="Filter by status"
            className="flex gap-2"
          >
            {FILTERS.map((filter) => (
              <Button
                key={filter.value}
                size="sm"
                variant={status === filter.value ? "secondary" : "ghost"}
                aria-pressed={status === filter.value}
                onClick={() => handleStatusChange(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          <Button size="sm" onClick={handleOpenCreate}>
            New project
          </Button>
        </div>
      </div>

      {statusError ? (
        <p
          role="alert"
          className="mb-4 rounded-box border border-danger-border bg-danger-subtle px-3 py-2 text-caption font-medium text-danger"
        >
          {statusError}
        </p>
      ) : null}

      {isPending ? (
        <p role="status" className="text-body text-muted-foreground">
          Loading projects...
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
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-border-strong px-6 py-16 text-center">
          <FolderKanban
            aria-hidden="true"
            className="size-6 text-muted-foreground"
          />
          <p className="text-body font-medium">No projects found</p>
          <p className="text-caption text-muted-foreground">
            {search || status !== "all"
              ? "Try a different search or filter."
              : "Create the first project to get started."}
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const isActive = project.status === "active";
            return (
              <li key={project.id}>
                <Card interactive className="h-full p-4 sm:p-5">
                  <CardHeader className="p-0 pb-3">
                    <div className="min-w-0">
                      <CardTitle>
                        <Link
                          to={`/projects/${project.id}`}
                          className="cursor-pointer rounded-box hover:text-blue-500 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                        >
                          {project.title}
                        </Link>
                      </CardTitle>
                      {project.clientName ? (
                        <CardDescription>{project.clientName}</CardDescription>
                      ) : null}
                    </div>
                    <Badge
                      tone={isActive ? "success" : "neutral"}
                      dot
                      className="mt-px shrink-0"
                    >
                      {isActive ? "Active" : "Inactive"}
                    </Badge>
                  </CardHeader>

                  {project.description ? (
                    <p className="line-clamp-2 text-caption text-muted-foreground">
                      {project.description}
                    </p>
                  ) : null}

                  <CardFooter className="mt-auto gap-2 pt-3">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/projects/${project.id}`}>
                        Open board
                        <ArrowUpRight aria-hidden="true" className="size-3.5" />
                      </Link>
                    </Button>

                    <div
                      role="group"
                      aria-label="Project actions"
                      className="flex items-center gap-0.5"
                    >
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Members"
                        title="Manage members"
                        onClick={() => setMembersFor(project)}
                      >
                        <Users aria-hidden="true" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Edit"
                        title="Edit project"
                        onClick={() => setEditingProject(project)}
                      >
                        <Pencil aria-hidden="true" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={isActive ? "Deactivate" : "Activate"}
                        title={
                          isActive
                            ? "Deactivate project"
                            : "Activate project"
                        }
                        disabled={setProjectStatus.isPending}
                        onClick={() =>
                          setProjectStatus.mutate({
                            id: project.id,
                            next: isActive ? "deactivate" : "activate",
                          })
                        }
                      >
                        {isActive ? (
                          <CirclePause aria-hidden="true" />
                        ) : (
                          <CirclePlay aria-hidden="true" />
                        )}
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Delete"
                        title="Delete project"
                        className="text-danger hover:bg-danger-subtle hover:text-danger active:bg-danger-subtle"
                        onClick={() => setPendingDelete(project)}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 ? (
        <nav
          aria-label="Pagination"
          className="mt-8 flex items-center justify-between gap-4"
        >
          <p className="text-caption text-muted-foreground">
            Page {page} of {totalPages} - {total} projects
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={handlePreviousPage}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={handleNextPage}
            >
              Next
            </Button>
          </div>
        </nav>
      ) : null}
    </>
  );
}
