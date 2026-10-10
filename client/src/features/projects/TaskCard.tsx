import { useTaskCard } from "@/features/projects/hooks/useTaskCard";
import type { TaskCardProps } from "@/features/projects/hooks/useTaskCard";
import { TaskCardView } from "@/features/projects/components/TaskCardView";

export function TaskCard(p: TaskCardProps) {
  const h = useTaskCard(p);
  return <TaskCardView {...h} />;
}