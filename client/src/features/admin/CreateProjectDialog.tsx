import { useCreateProject } from "@/features/admin/hooks/useCreateProject";
import type { CreateProjectDialogProps } from "@/features/admin/hooks/useCreateProject";
import { CreateProjectView } from "@/features/admin/components/CreateProjectView";

export function CreateProjectDialog(props: CreateProjectDialogProps) {
  const h = useCreateProject(props);
  return <CreateProjectView {...h} />;
}