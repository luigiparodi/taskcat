import { useProjects } from "@/features/projects/hooks/useProjects";
import { ProjectsView } from "@/features/projects/components/ProjectsView";

export function ProjectsPage() {
  const h = useProjects();
  return <ProjectsView {...h} />;
}