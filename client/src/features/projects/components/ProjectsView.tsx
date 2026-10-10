import { Link } from "react-router-dom";
import { FolderKanban, Search } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardBadgeRow,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ProjectStatus } from "@/lib/api/types";
import type { useProjects } from "@/features/projects/hooks/useProjects";

const FILTERS: Array<{ label: string; value: ProjectStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

function formatDateRange(start?: string | null, end?: string | null) {
  const format = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  if (start && end) return `${format(start)} - ${format(end)}`;
  if (end) return `Due ${format(end)}`;
  if (start) return `Started ${format(start)}`;
  return "No dates set";
}

type ProjectsViewProps = ReturnType<typeof useProjects>;

export function ProjectsView({
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
}: ProjectsViewProps) {
  return (
    <div className="relative min-h-dvh bg-background">
      <AppHeader
        title="Projects"
        actions={
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Refresh
          </Button>
        }
      />

      <main className="mx-auto max-w-6xl px-6 py-8">
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
        </div>

        {isPending ? (
          <p role="status" className="text-body text-muted-foreground">
            Loading projects...
          </p>
        ) : isError ? (
          <div className="flex flex-col items-start gap-3 rounded-card border border-danger-border bg-danger-subtle p-4">
            <p role="alert" className="text-body font-medium text-danger">
              {errorMessage}
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
              {hasFilters
                ? "Try a different search or filter."
                : isAdmin
                  ? "Open the admin area to create the first project."
                  : "An admin has to create a project and add you as a member."}
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <li key={project.id}>
                <Card interactive className="h-full">
                  <CardHeader>
                    <CardTitle>
                      <Link
                        to={`/projects/${project.id}`}
                        className="rounded-box focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 hover:text-blue-500"
                      >
                        {project.title}
                      </Link>
                    </CardTitle>
                    {project.clientName ? (
                      <CardDescription>{project.clientName}</CardDescription>
                    ) : null}
                  </CardHeader>

                  {project.description ? (
                    <p className="line-clamp-2 text-caption text-muted-foreground">
                      {project.description}
                    </p>
                  ) : null}

                  <CardBadgeRow>
                    <Badge
                      tone={project.status === "active" ? "success" : "neutral"}
                      dot
                    >
                      {project.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </CardBadgeRow>

                  <CardFooter className="mt-auto text-caption text-muted-foreground">
                    {formatDateRange(project.startDate, project.endDate)}
                  </CardFooter>
                </Card>
              </li>
            ))}
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
      </main>
    </div>
  );
}
