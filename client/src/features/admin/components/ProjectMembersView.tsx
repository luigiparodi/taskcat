import { UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { useProjectMembers } from "@/features/admin/hooks/useProjectMembers";

type ProjectMembersViewProps = ReturnType<typeof useProjectMembers>;

export function ProjectMembersView({
  open,
  onOpenChange,
  handleDone,
  projectTitle,
  picked,
  setPicked,
  handleAdd,
  isAdding,
  addError,
  candidates,
  isUsersPending,
  usersError,
  members,
  isMembersPending,
  membersError,
  handleRetryMembers,
  handleRequestRemoval,
  handleRemovalOpenChange,
  handleConfirmRemoval,
  isRemovalOpen,
  pendingRemovalName,
  isRemoving,
  removeError,
}: ProjectMembersViewProps) {
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Members</DialogTitle>
            <DialogDescription>
              Anyone you add here can open {projectTitle}. Project admins cannot
              be removed.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="flex flex-col gap-5">
            <Field>
              <FieldLabel htmlFor="add-member">Add a member</FieldLabel>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select value={picked} onValueChange={setPicked}>
                  <SelectTrigger id="add-member">
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent className="z-9999">
                    {candidates.length === 0 ? (
                      <SelectItem disabled value="">
                        No users available
                      </SelectItem>
                    ) : (
                      candidates.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} - {user.email}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  disabled={!picked || isAdding}
                  onClick={handleAdd}
                >
                  <UserPlus aria-hidden="true" />
                  {isAdding ? "Adding..." : "Add"}
                </Button>
              </div>

              {isUsersPending ? (
                <p role="status" className="text-caption text-muted-foreground">
                  Loading users...
                </p>
              ) : null}

              {!isUsersPending && candidates.length === 0 ? (
                <p className="text-caption text-muted-foreground">
                  Everyone is already a member of this project.
                </p>
              ) : null}

              {usersError ? (
                <p
                  role="alert"
                  className="text-caption font-medium text-danger"
                >
                  {usersError}
                </p>
              ) : null}
            </Field>

            {addError ? (
              <p
                role="alert"
                className="rounded-box border border-danger-border bg-danger-subtle px-3 py-2 text-caption font-medium text-danger"
              >
                {addError}
              </p>
            ) : null}

            {removeError ? (
              <p
                role="alert"
                className="rounded-box border border-danger-border bg-danger-subtle px-3 py-2 text-caption font-medium text-danger"
              >
                {removeError}
              </p>
            ) : null}

            {isMembersPending ? (
              <p role="status" className="text-body text-muted-foreground">
                Loading members...
              </p>
            ) : membersError ? (
              <div className="flex flex-col items-start gap-3 rounded-card border border-danger-border bg-danger-subtle p-4">
                <p role="alert" className="text-body font-medium text-danger">
                  {membersError}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetryMembers}
                >
                  Try again
                </Button>
              </div>
            ) : members.length === 0 ? (
              <p className="rounded-box border border-dashed border-border-strong px-3 py-6 text-center text-caption text-muted-foreground">
                No members yet
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {members.map((member) => (
                  <li
                    key={member.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-box border border-border bg-background px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-body font-medium">
                        {member.name}
                      </p>
                      <p className="truncate text-caption text-muted-foreground">
                        {member.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        tone={member.role === "admin" ? "info" : "neutral"}
                        dot
                      >
                        {member.role === "admin" ? "Project admin" : "Member"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={member.role === "admin" || isRemoving}
                        onClick={() => handleRequestRemoval(member)}
                      >
                        Remove
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleDone}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isRemovalOpen} onOpenChange={handleRemovalOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {pendingRemovalName}?</AlertDialogTitle>
            <AlertDialogDescription>
              They lose access to {projectTitle} straight away. Tasks they
              created stay on the board.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRemoval}>
              {isRemoving ? "Removing..." : "Remove member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
