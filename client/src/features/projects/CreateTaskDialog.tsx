import { useCreateTask } from "@/features/projects/hooks/useCreateTask";
import type { CreateTaskDialogProps } from "@/features/projects/hooks/useCreateTask";
import { CreateTaskView } from "@/features/projects/components/CreateTaskView";

export function CreateTaskDialog(props: CreateTaskDialogProps) {
  const h = useCreateTask(props);
  return <CreateTaskView {...h} />;
}
