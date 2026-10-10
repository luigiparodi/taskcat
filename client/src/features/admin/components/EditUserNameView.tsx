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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { useEditUserName } from "@/features/admin/hooks/useEditUserName";

type EditUserNameViewProps = ReturnType<typeof useEditUserName>;

export function EditUserNameView({
  user,
  onOpenChange,
  name,
  setName,
  nameError,
  handleSubmit,
  submitError,
  isPending,
}: EditUserNameViewProps) {
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>Edit {user.name}</DialogTitle>
            <DialogDescription>{user.email}</DialogDescription>
          </DialogHeader>

          <DialogBody>
            <Field invalid={Boolean(nameError)}>
              <FieldLabel htmlFor="edit-user-name">Name</FieldLabel>
              <Input
                id="edit-user-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={Boolean(nameError)}
                autoComplete="off"
              />
              <FieldError>{nameError}</FieldError>
            </Field>

            {submitError ? (
              <p
                role="alert"
                className="mt-3 rounded-box border border-danger-border bg-danger-subtle px-3 py-2 text-caption font-medium text-danger"
              >
                {submitError}
              </p>
            ) : null}
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}