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
import type { useCreateProject } from "@/features/admin/hooks/useCreateProject";

type CreateProjectViewProps = ReturnType<typeof useCreateProject>;

export function CreateProjectView({
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
}: CreateProjectViewProps) {
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>
              You become the project admin, so you can manage tasks and members.
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

            <Field invalid={Boolean(errors.title)}>
              <FieldLabel htmlFor="new-project-title">Title</FieldLabel>
              <Input
                id="new-project-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                aria-invalid={Boolean(errors.title)}
                autoComplete="off"
              />
              <FieldError>{errors.title}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="new-project-client">Client</FieldLabel>
              <Input
                id="new-project-client"
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
                autoComplete="off"
              />
              <FieldHint>Optional</FieldHint>
            </Field>

            <Field invalid={Boolean(errors.description)}>
              <FieldLabel htmlFor="new-project-description">Description</FieldLabel>
              <Textarea
                id="new-project-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                aria-invalid={Boolean(errors.description)}
                rows={3}
              />
              <FieldError>{errors.description}</FieldError>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="new-project-start">Start date</FieldLabel>
                <Input
                  id="new-project-start"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </Field>

              <Field invalid={Boolean(errors.dates)}>
                <FieldLabel htmlFor="new-project-end">End date</FieldLabel>
                <Input
                  id="new-project-end"
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
              {isPending ? "Creating..." : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}