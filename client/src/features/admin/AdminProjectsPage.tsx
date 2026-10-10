import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAdminProjects } from "@/features/admin/hooks/useAdminProjects";
import { AdminProjectsView } from "@/features/admin/components/AdminProjectsView";
import { CreateProjectDialog } from "@/features/admin/CreateProjectDialog";
import { EditProjectDialog } from "@/features/admin/EditProjectDialog";
import { ProjectMembersDialog } from "@/features/admin/ProjectMembersDialog";

export function AdminProjectsPage() {
  const h = useAdminProjects();

  return (
    <>
      <AdminProjectsView {...h} />

      <CreateProjectDialog
        open={h.createOpen}
        onOpenChange={h.handleCreateOpenChange}
        onCreated={h.handleCreated}
      />

      <ProjectMembersDialog
        projectId={h.membersFor?.id ?? ""}
        projectTitle={h.membersFor?.title ?? ""}
        open={h.membersFor !== null}
        onOpenChange={h.handleMembersOpenChange}
      />

      <EditProjectDialog
        key={h.editingProject?.id ?? "none"}
        project={h.editingProject}
        onOpenChange={h.handleEditOpenChange}
      />

      <AlertDialog
        open={h.pendingDelete !== null}
        onOpenChange={h.handleDeleteOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {h.pendingDelete?.title}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the project along with its tasks,
              comments, links and history. It cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {h.deleteError ? (
            <p role="alert" className="text-caption font-medium text-danger">
              {h.deleteError}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={h.handleConfirmDelete}>
              {h.deleteProject.isPending ? "Deleting..." : "Delete project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
