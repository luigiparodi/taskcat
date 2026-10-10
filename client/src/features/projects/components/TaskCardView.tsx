import { CalendarDays, Clock, GripVertical } from "lucide-react";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { Card, CardBadgeRow, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { useTaskCard } from "@/features/projects/hooks/useTaskCard";

type TaskCardViewProps = ReturnType<typeof useTaskCard>;

export function TaskCardView({
  task,
  canMove,
  moving,
  isOverdue,
  assigneeName,
  currentLabel,
  statusItems,
  dueLabel,
  hoursLabel,
  moveLabel,
  handleOpen,
  handleMove,
}: TaskCardViewProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="h-full" {...attributes} {...listeners}>
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={handleOpen}
          className="flex-1 cursor-pointer hover:text-blue-500 transition-discrete rounded-box text-left text-body font-medium text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          {task.title}
        </button>
        {canMove && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 rounded-box"
            aria-label={moveLabel}
            aria-describedby={`drag-hint-${task.id}`}
          >
            <GripVertical aria-hidden="true" className="size-5" />
          </button>
        )}
      </div>

      <div id={`drag-hint-${task.id}`} className="sr-only">
        Press space to lift, arrow keys to move, space to drop
      </div>

      {task.description ? (
        <p className="line-clamp-2 text-caption text-muted-foreground">
          {task.description}
        </p>
      ) : null}

      <CardBadgeRow>
        <PriorityBadge priority={task.priority} />
        <StatusBadge status={task.status} />
        {isOverdue ? (
          <span className="inline-flex items-center gap-1 text-caption font-medium text-danger">
            Overdue
          </span>
        ) : null}
      </CardBadgeRow>

      <CardFooter className="mt-auto flex flex-wrap items-center justify-between gap-2">
        <span className="text-caption text-muted-foreground">
          {assigneeName}
        </span>

        <span className="flex items-center gap-3 text-caption text-muted-foreground">
          {dueLabel ? (
            <span className="inline-flex items-center gap-1">
              <CalendarDays aria-hidden="true" className="size-3.5" />
              {dueLabel}
            </span>
          ) : null}
          {hoursLabel ? (
            <span className="inline-flex items-center gap-1">
              <Clock aria-hidden="true" className="size-3.5" />
              {hoursLabel}
            </span>
          ) : null}
        </span>
      </CardFooter>

      {canMove ? (
        <Select
          value={task.status}
          onValueChange={handleMove}
          disabled={moving || isDragging}
        >
          <SelectTrigger aria-label={moveLabel}>
            <SelectValue placeholder={currentLabel} />
          </SelectTrigger>
          <SelectContent>
            {statusItems.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </Card>
  );
}