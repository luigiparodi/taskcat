import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { useCreateTask } from "@/features/projects/hooks/useCreateTask";

type CreateTaskViewProps = ReturnType<typeof useCreateTask>;

export function CreateTaskView({
  open,
  onOpenChange,
  members,
  PRIORITIES,
  NO_ASSIGNEE,
  title,
  setTitle,
  description,
  setDescription,
  priority,
  handlePriorityChange,
  assignee,
  setAssignee,
  endDate,
  setEndDate,
  estimatedHours,
  setEstimatedHours,
  titleError,
  errorMessage,
  isPending,
  handleSubmit,
  handleCancel,
}: CreateTaskViewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus aria-hidden="true" />
          New task
        </Button>
      </DialogTrigger>

      <DialogContent size="lg">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
            <DialogDescription>
              Add a task to the pending column.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="flex flex-col gap-4">
            {errorMessage ? (
              <p
                role="alert"
                className="rounded-box border border-danger-border bg-danger-subtle px-3 py-2 text-caption font-medium text-danger"
              >
                {errorMessage}
              </p>
            ) : null}

            <Field invalid={Boolean(titleError)}>
              <FieldLabel>Title</FieldLabel>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Design the settings page"
              />
              <FieldError>{titleError}</FieldError>
            </Field>

            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Optional context for whoever picks this up"
                rows={3}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="new-task-priority">Priority</FieldLabel>
                <Select value={priority} onValueChange={handlePriorityChange}>
                  <SelectTrigger id="new-task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-9999">
                    {PRIORITIES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="new-task-assignee">Assignee</FieldLabel>
                <Select value={assignee} onValueChange={setAssignee}>
                  <SelectTrigger id="new-task-assignee">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent className="z-9999">
                    <SelectItem value={NO_ASSIGNEE}>Unassigned</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="new-task-due">Due date</FieldLabel>
                <Input
                  id="new-task-due"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="new-task-hours">
                  Estimated hours
                </FieldLabel>
                <Input
                  id="new-task-hours"
                  type="number"
                  min={0}
                  step={0.5}
                  value={estimatedHours}
                  onChange={(event) => setEstimatedHours(event.target.value)}
                />
              </Field>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              Create task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
