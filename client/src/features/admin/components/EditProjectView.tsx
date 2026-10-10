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
import { Field, FieldError, FieldHint, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { useEditProject } from "@/features/admin/hooks/useEditProject";

type EditProjectViewProps = ReturnType<typeof useEditProject>;

export function EditProjectView({
  open,
  handleOpenChange,
  handleSubmit,
  title,
  setTitle,
  description,
  setDescription,
  clientName,
  setClientName,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  errors,
  formError,
  isPending,
}: EditProjectViewProps) {
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
            <DialogDescription>
              Update project details, client, description or schedule.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="flex flex-col gap-4">
            {formError ? (
              <p
                role="alert"
                className="rounded-box border border-danger-border bg-danger-subtle px-3 py-2 text-caption font-medium text-danger"
              >
                {formError}
              </p>
            ) : null}

            {errors.dates && (
              <p
                role="alert"
                className="rounded-box border border-danger-border bg-danger-subtle px-3 py-2 text-caption font-medium text-danger mt-2"
              >
                {errors.dates}
              </p>
            )}

            <Field invalid={Boolean(errors.title)}>
              <FieldLabel htmlFor="edit-project-title">Title</FieldLabel>
              <Input
                id="edit-project-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                aria-invalid={Boolean(errors.title)}
                autoComplete="off"
              />
              <FieldError>{errors.title}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-project-client">Client</FieldLabel>
              <Input
                id="edit-project-client"
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
                autoComplete="off"
              />
              <FieldHint>Optional</FieldHint>
            </Field>

            <Field invalid={Boolean(errors.description)}>
              <FieldLabel htmlFor="edit-project-description">Description</FieldLabel>
              <Textarea
                id="edit-project-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                aria-invalid={Boolean(errors.description)}
                rows={3}
              />
              <FieldError>{errors.description}</FieldError>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="edit-project-start">Start date</FieldLabel>
                <Input
                  id="edit-project-start"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </Field>

              <Field invalid={Boolean(errors.dates)}>
                <FieldLabel htmlFor="edit-project-end">End date</FieldLabel>
                <Input
                  id="edit-project-end"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  aria-invalid={Boolean(errors.dates)}
                />
                <FieldError>{errors.dates}</FieldError>
              </Field>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
