import { useEditProject } from "@/features/admin/hooks/useEditProject";
import type { EditProjectDialogProps } from "@/features/admin/hooks/useEditProject";
import { EditProjectView } from "@/features/admin/components/EditProjectView";

export function EditProjectDialog(props: EditProjectDialogProps) {
  const h = useEditProject(props);
  return <EditProjectView {...h} />;
}
