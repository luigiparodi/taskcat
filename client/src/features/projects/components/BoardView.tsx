import { Button } from "@/components/ui/button";
import { AppHeader, BackToProjectsButton } from "@/components/AppHeader";
import type { Task, TaskStatus } from "@/lib/api/types";
import { TaskCard } from "@/features/projects/TaskCard";
import { TaskDetailDialog } from "@/features/projects/TaskDetailDialog";
import { CreateTaskDialog } from "@/features/projects/CreateTaskDialog";
import { ImportTasksDialog } from "@/features/projects/ImportTasksDialog";
import type { useBoard } from "@/features/projects/hooks/useBoard";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

type BoardViewProps = ReturnType<typeof useBoard>;

export function BoardView({
  projectId,
  project,
  board,
  members,
  memberNames,
  canManageTasks,
  moveError,
  importNotice,
  handleImported,
  createOpen,
  setCreateOpen,
  openTaskId,
  setOpenTaskId,
  pendingTaskId,
  nowMs,
  openTask,
  totalTasks,
  columns,
  COLUMNS,
  moveMutation,
  user,
}: BoardViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    if (taskId === newStatus) return;

    const task = COLUMNS.flatMap((col) => columns[col.status]).find((t) => t.id === taskId);
    if (!task) return;

    const isAssignee = task.assignedTo === user?.id;
    const isAdmin = user?.role === "admin";
    const isProjectAdmin = canManageTasks;

    if (!isAssignee && !isAdmin && !isProjectAdmin) {
      return;
    }

    moveMutation.mutate({ taskId, status: newStatus });
  }

  function Column({ status, title, tasks }: { status: TaskStatus; title: string; tasks: Task[] }) {
    const { setNodeRef, isOver } = useDroppable({ id: status });

    return (
      <section
        ref={setNodeRef}
        key={status}
        aria-label={title}
        className={`flex flex-col gap-3 rounded-card bg-surface-2/60 p-3 transition-colors duration-150 ${
          isOver ? "bg-primary/10 border-2 border-primary" : "bg-surface-2/60"
        }`}
      >
        <h2 className="flex items-center justify-between px-1 text-caption font-medium text-muted-foreground">
          {title}
          <span className="tabular-nums">{tasks.length}</span>
        </h2>

        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <div
              id={status}
              className="rounded-box border border-dashed border-border-strong px-3 py-6 text-center text-caption text-muted-foreground min-h-[100px]"
              role="list"
              aria-label={`${title} column, empty`}
            >
              Nothing here yet
            </div>
          ) : (
            <ul
              id={status}
              className="flex flex-col gap-3"
              role="list"
              aria-label={`${title} column`}
            >
              {tasks.map((task) => (
                <li key={task.id}>
                  <TaskCard
                    task={task}
                    canManage={canManageTasks}
                    pendingTaskId={pendingTaskId}
                    memberNames={memberNames}
                    nowMs={nowMs}
                    onOpenTask={() => setOpenTaskId(task.id)}
                    onMove={(status: TaskStatus) =>
                      moveMutation.mutate({ taskId: task.id, status })
                    }
                    currentUserId={user?.id ?? ""}
                  />
                </li>
              ))}
            </ul>
          )}
        </SortableContext>
      </section>
    );
  }

  return (
    <div className="relative min-h-dvh bg-background">
      <AppHeader
        title={project.data?.title ?? "Board"}
        subtitle={`${totalTasks} ${totalTasks === 1 ? "task" : "tasks"}`}
        leading={<BackToProjectsButton />}
        actions={
          canManageTasks ? (
            <>
              <ImportTasksDialog
                projectId={projectId}
                members={members.data?.members ?? []}
                onImported={handleImported}
              />
              <CreateTaskDialog
                projectId={projectId}
                members={members.data?.members ?? []}
                open={createOpen}
                onOpenChange={setCreateOpen}
              />
            </>
          ) : null
        }
      />

      <main className="mx-auto max-w-6xl px-6 py-6">
        {importNotice ? (
          <p
            role="status"
            className="mb-4 rounded-box border border-success-border bg-success-subtle px-3 py-2 text-caption font-medium text-success-on-subtle"
          >
            {importNotice}
          </p>
        ) : null}

        {moveError ? (
          <p role="alert" className="mb-4 rounded-box border border-danger-border bg-danger-subtle px-3 py-2 text-caption font-medium text-danger">
            {moveError}
          </p>
        ) : null}

        {project.isError ? (
          <p role="alert" className="text-body text-danger">
            {project.error instanceof Error ? project.error.message : "Unable to load this project"}
          </p>
        ) : board.isPending ? (
          <p role="status" className="text-body text-muted-foreground">
            Loading the board...
          </p>
        ) : board.isError ? (
          <div className="flex flex-col items-start gap-3 rounded-card border border-danger-border bg-danger-subtle p-4">
            <p role="alert" className="text-body font-medium text-danger">
              {board.error instanceof Error ? board.error.message : "Unable to load tasks"}
            </p>
            <Button size="sm" variant="outline" onClick={() => void board.refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="grid gap-4 lg:grid-cols-3">
              {COLUMNS.map((column) => {
                const tasks = columns[column.status];
                return (
                  <Column
                    key={column.status}
                    status={column.status}
                    title={column.title}
                    tasks={tasks}
                  />
                );
              })}
            </div>
          </DndContext>
        )}
      </main>

      {openTask ? (
        <TaskDetailDialog
          projectId={projectId}
          task={openTask}
          canManage={canManageTasks}
          currentUserId={user?.id ?? ""}
          memberNames={memberNames}
          open={openTaskId !== null}
          onOpenChange={(next: boolean) => {
            if (!next) setOpenTaskId(null);
          }}
        />
      ) : null}
    </div>
  );
}