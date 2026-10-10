import { BarChart3, FolderKanban, ListChecks, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CountUp from "@/components/CountUp";
import { cn } from "@/lib/utils";
import type { TaskStatusCounts } from "@/lib/api/types";
import type { useAdminAnalytics } from "@/features/admin/hooks/useAdminAnalytics";

type AdminAnalyticsViewProps = ReturnType<typeof useAdminAnalytics>;

const STATUS_SEGMENTS = [
  { key: "pending", label: "Pending", className: "bg-chart-1" },
  { key: "working", label: "Working", className: "bg-chart-2" },
  { key: "finished", label: "Finished", className: "bg-chart-3" },
] as const;

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "danger";
}) {
  return (
    <div className="rounded-card border border-border bg-surface-1 p-4 shadow-card">
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-1 text-heading font-semibold tabular-nums",
          tone === "danger" && "text-danger",
        )}
      >
        <CountUp to={value} duration={0.8} />
      </dd>
    </div>
  );
}

function StatusBar({ counts }: { counts: TaskStatusCounts }) {
  const total = counts.pending + counts.working + counts.finished;
  if (total === 0) {
    return (
      <div
        role="img"
        aria-label="No tasks yet"
        className="h-3 w-full overflow-hidden rounded-button bg-muted"
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={`${total} tasks by status`}
      className="flex h-3 w-full overflow-hidden rounded-button bg-muted"
    >
      {STATUS_SEGMENTS.map((segment) =>
        counts[segment.key] === 0 ? null : (
          <div
            key={segment.key}
            className={cn("h-full", segment.className)}
            style={{ width: `${Math.round((counts[segment.key] / total) * 100)}%` }}
          />
        ),
      )}
    </div>
  );
}

function dayOfMonth(date: string): string {
  return String(Number(date.slice(-2)));
}

export function AdminAnalyticsView({
  analytics,
  isPending,
  isError,
  loadError,
  handleRefresh,
}: AdminAnalyticsViewProps) {
  return (
    <>
      {isPending ? (
        <p role="status" className="text-body text-muted-foreground">
          Loading analytics...
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
      ) : analytics ? (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 aria-hidden="true" className="size-4 text-muted-foreground" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <StatTile label="Projects" value={analytics.overview.totalProjects} />
                <StatTile label="Active projects" value={analytics.overview.activeProjects} />
                <StatTile label="All tasks" value={analytics.overview.totalTasks} />
                <StatTile label="Open tasks" value={analytics.overview.openTasks} />
                <StatTile label="Overdue" value={analytics.overview.overdueTasks} tone="danger" />
                <StatTile label="Active members" value={analytics.overview.activeMembers} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks aria-hidden="true" className="size-4 text-muted-foreground" />
                Task status
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <StatusBar counts={analytics.taskStatus} />
              <ul className="flex flex-col gap-2">
                {STATUS_SEGMENTS.map((segment) => {
                  const total =
                    analytics.taskStatus.pending +
                    analytics.taskStatus.working +
                    analytics.taskStatus.finished;
                  const count = analytics.taskStatus[segment.key];
                  return (
                    <li
                      key={segment.key}
                      className="flex items-center justify-between gap-4 text-caption"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className={cn("size-2.5 rounded-full", segment.className)}
                        />
                        {segment.label}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {count}
                        {total > 0 ? ` · ${Math.round((count / total) * 100)}%` : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users aria-hidden="true" className="size-4 text-muted-foreground" />
                Member workload
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.workload.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-box border border-dashed border-border-strong px-6 py-10 text-center">
                  <Users aria-hidden="true" className="size-6 text-muted-foreground" />
                  <p className="text-body font-medium">No workers yet</p>
                  <p className="text-caption text-muted-foreground">
                    Create worker accounts to see their workload.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {analytics.workload.map((worker) => {
                    const completion =
                      worker.assignedTasks === 0
                        ? 0
                        : Math.round((worker.completedTasks / worker.assignedTasks) * 100);
                    return (
                      <li
                        key={worker.userId}
                        className="rounded-card border border-border bg-surface-1 px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-body font-medium">{worker.name}</p>
                            <p className="truncate text-caption text-muted-foreground">
                              {worker.email}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-caption tabular-nums text-muted-foreground">
                            <span>{worker.assignedTasks} assigned</span>
                            <span className="text-foreground">{worker.openTasks} open</span>
                            <span>{worker.completedTasks} done</span>
                            <span>{worker.estimatedHours}h est.</span>
                          </div>
                        </div>
                        <div
                          role="progressbar"
                          aria-label={`${worker.name} completion`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={completion}
                          className="mt-3 h-2 w-full overflow-hidden rounded-button bg-muted"
                        >
                          <div
                            className={cn("h-full rounded-button", completion === 0 ? "bg-muted" : "bg-chart-3")}
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban aria-hidden="true" className="size-4 text-muted-foreground" />
                Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.projects.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-box border border-dashed border-border-strong px-6 py-10 text-center">
                  <FolderKanban aria-hidden="true" className="size-6 text-muted-foreground" />
                  <p className="text-body font-medium">No projects yet</p>
                  <p className="text-caption text-muted-foreground">
                    Projects appear here once tasks exist.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {analytics.projects.map((project) => (
                    <li
                      key={project.projectId}
                      className="rounded-card border border-border bg-surface-1 px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="min-w-0 truncate text-body font-medium">{project.title}</p>
                        <Badge tone={project.status === "active" ? "success" : "neutral"}>
                          {project.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div
                        role="progressbar"
                        aria-label={`${project.title} progress`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={project.progress}
                        className="mt-3 h-2 w-full overflow-hidden rounded-button bg-muted"
                      >
                        <div
                          className={cn("h-full rounded-button", project.progress === 0 ? "bg-muted" : "bg-chart-3")}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <p className="mt-2 text-caption tabular-nums text-muted-foreground">
                        {project.pending} pending · {project.working} in progress · {project.finished} done ·{" "}
                        {project.progress}% complete
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp aria-hidden="true" className="size-4 text-muted-foreground" />
                Task creation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                role="img"
                aria-label="Tasks created per day over the last 14 days"
                className="flex h-40 items-end gap-1"
              >
                {analytics.activity.map((point) => {
                  const maxCreated = Math.max(
                    1,
                    ...analytics.activity.map((entry) => entry.created),
                  );
                  const height =
                    point.created === 0
                      ? 2
                      : Math.max(6, Math.round((point.created / maxCreated) * 100));
                  return (
                    <div
                      key={point.date}
                      className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1"
                    >
                      <div
                        className={cn(
                          "w-full rounded-t-sm",
                          point.created === 0 ? "bg-muted" : "bg-chart-4",
                        )}
                        style={{ height: `${height}%` }}
                        title={`${point.date}: ${point.created} ${point.created === 1 ? "task" : "tasks"}`}
                      />
                      <span className="text-center text-footnote text-muted-foreground">
                        {dayOfMonth(point.date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}