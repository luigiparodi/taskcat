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
import { useAdminUsers } from "@/features/admin/hooks/useAdminUsers";
import { AdminUsersView } from "@/features/admin/components/AdminUsersView";
import { EditUserNameDialog } from "@/features/admin/components/EditUserNameDialog";

export function AdminUsersPage() {
  const h = useAdminUsers();

  return (
    <>
      <AdminUsersView {...h} />

      {h.editing ? (
        <EditUserNameDialog
          key={h.editing.id}
          user={h.editing}
          onOpenChange={(next) => {
            if (!next) {
              h.setEditing(null);
            }
          }}
        />
      ) : null}

      <AlertDialog
        open={h.pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) {
            h.setPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {h.pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Their sessions are revoked and their tasks stay on the boards, but they can no longer
              sign in. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => {
                if (h.pendingDelete) {
                  h.removeUser.mutate(h.pendingDelete.id);
                }
              }}
            >
              {h.removeUser.isPending ? "Deleting..." : "Delete user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={h.pendingRoleChange !== null}
        onOpenChange={(next) => {
          if (!next) {
            h.setPendingRoleChange(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Make {h.pendingRoleChange?.name}{" "}
              {h.pendingRoleChange?.role === "admin" ? "a worker" : "an admin"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {h.pendingRoleChange?.role === "admin"
                ? "They keep their account and assigned tasks but lose access to admin-only areas."
                : "They gain full access to manage users, projects and roles."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (h.pendingRoleChange) {
                  h.changeRole.mutate({
                    id: h.pendingRoleChange.id,
                    role: h.pendingRoleChange.role === "admin" ? "worker" : "admin",
                  });
                }
                h.setPendingRoleChange(null);
              }}
            >
              {h.changeRole.isPending ? "Saving..." : "Change role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}