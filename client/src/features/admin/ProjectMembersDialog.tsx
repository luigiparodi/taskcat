import { useProjectMembers } from "@/features/admin/hooks/useProjectMembers";
import type { ProjectMembersDialogProps } from "@/features/admin/hooks/useProjectMembers";
import { ProjectMembersView } from "@/features/admin/components/ProjectMembersView";

export function ProjectMembersDialog(p: ProjectMembersDialogProps) {
  const h = useProjectMembers(p);
  return <ProjectMembersView {...h} />;
}
