import { useTaskDetail } from "@/features/projects/hooks/useTaskDetail";
import type { TaskDetailDialogProps } from "@/features/projects/hooks/useTaskDetail";
import { TaskDetailView } from "@/features/projects/components/TaskDetailView";

export function TaskDetailDialog(props: TaskDetailDialogProps) {
  const h = useTaskDetail(props);
  return <TaskDetailView {...h} />;
}