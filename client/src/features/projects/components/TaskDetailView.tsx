import * as React from "react";
import { History, Link2, MessageSquare, Pencil, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { useTaskDetail } from "@/features/projects/hooks/useTaskDetail";

type TaskDetailViewProps = ReturnType<typeof useTaskDetail>;

const HISTORY_ACTION_LABELS: Record<string, string> = {
  created: "created this task",
  status_changed: "changed the status",
  title_changed: "changed the title",
  description_changed: "changed the description",
  priority_changed: "changed the priority",
  estimated_hours_changed: "changed the estimated hours",
  end_date_changed: "changed the due date",
  assigned_to_changed: "changed the assignee",
};

function historyActionLabel(action: string) {
  return HISTORY_ACTION_LABELS[action] ?? action.replace(/_/g, " ");
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function SectionHeading({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h3
      id={id}
      className="flex items-center gap-1.5 text-caption font-medium text-muted-foreground"
    >
      {children}
    </h3>
  );
}

export function TaskDetailView({
  task,
  canManage,
  currentUserId,
  memberNames,
  open,
  onOpenChange,
  canUpdate,
  nameOf,
  PRIORITIES,
  NO_ASSIGNEE,
  editing,
  setEditing,
  startEditing,
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
  handleEditSubmit,
  updateMutation,
  editError,
  comments,
  commentsError,
  commentItems,
  commentText,
  setCommentText,
  handleCommentSubmit,
  addComment,
  addCommentError,
  removeComment,
  links,
  linksError,
  linkItems,
  linkUrl,
  setLinkUrl,
  linkTitle,
  setLinkTitle,
  handleLinkSubmit,
  addLink,
  addLinkError,
  removeLink,
  history,
  historyError,
  historyItems,
  confirmingDelete,
  setConfirmingDelete,
  handleConfirmingDeleteChange,
  confirmDelete,
  deleteMutation,
  deleteError,
}: TaskDetailViewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
          <DialogDescription>
            Task details, discussion, links and history.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-6">
          {editing ? (
            <form
              id="task-edit-form"
              onSubmit={handleEditSubmit}
              className="flex flex-col gap-4"
            >
              {editError ? (
                <p
                  role="alert"
                  className="rounded-box border border-danger-border bg-danger-subtle px-3 py-2 text-caption font-medium text-danger"
                >
                  {editError}
                </p>
              ) : null}

              <Field invalid={Boolean(titleError)}>
                <FieldLabel htmlFor="task-edit-title">Title</FieldLabel>
                <Input
                  id="task-edit-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
                <FieldError>{titleError}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="task-edit-description">
                  Description
                </FieldLabel>
                <Textarea
                  id="task-edit-description"
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="task-edit-priority">Priority</FieldLabel>
                  <Select value={priority} onValueChange={handlePriorityChange}>
                    <SelectTrigger id="task-edit-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {canManage ? (
                  <Field>
                    <FieldLabel htmlFor="task-edit-assignee">
                      Assignee
                    </FieldLabel>
                    <Select value={assignee} onValueChange={setAssignee}>
                      <SelectTrigger id="task-edit-assignee">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_ASSIGNEE}>Unassigned</SelectItem>
                        {[...memberNames].map(([id, name]) => (
                          <SelectItem key={id} value={id}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                ) : null}

                <Field>
                  <FieldLabel htmlFor="task-edit-due">Due date</FieldLabel>
                  <Input
                    id="task-edit-due"
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="task-edit-hours">
                    Estimated hours
                  </FieldLabel>
                  <Input
                    id="task-edit-hours"
                    type="number"
                    min={0}
                    step={0.5}
                    value={estimatedHours}
                    onChange={(event) => setEstimatedHours(event.target.value)}
                  />
                </Field>
              </div>
            </form>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                <span className="text-caption text-muted-foreground">
                  {task.assignedTo ? nameOf(task.assignedTo) : "Unassigned"}
                </span>
              </div>

              {task.description ? (
                <p className="text-body whitespace-pre-wrap text-foreground">
                  {task.description}
                </p>
              ) : (
                <p className="text-caption text-muted-foreground">
                  No description.
                </p>
              )}

              <dl className="grid grid-cols-2 gap-3 text-caption sm:grid-cols-4">
                <div>
                  <dt className="text-muted-foreground">Due</dt>
                  <dd className="font-medium">
                    {task.endDate ? formatDateTime(task.endDate) : "None"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Estimated</dt>
                  <dd className="font-medium">
                    {task.estimatedHours ? `${task.estimatedHours}h` : "None"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Actual</dt>
                  <dd className="font-medium">
                    {task.actualHours ? `${task.actualHours}h` : "None"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="font-medium">
                    {formatDateTime(task.createdAt)}
                  </dd>
                </div>
              </dl>
            </>
          )}

          {editing ? null : (
            <>
              <section
                aria-labelledby="detail-comments"
                className="flex flex-col gap-3"
              >
                <SectionHeading id="detail-comments">
                  <MessageSquare aria-hidden="true" className="size-3.5" />
                  Comments
                </SectionHeading>

                {addCommentError ? (
                  <p
                    role="alert"
                    className="text-caption font-medium text-danger"
                  >
                    {addCommentError}
                  </p>
                ) : null}

                <form
                  onSubmit={handleCommentSubmit}
                  className="flex flex-col gap-2"
                >
                  <Field>
                    <FieldLabel className="sr-only">Add a comment</FieldLabel>
                    <Textarea
                      value={commentText}
                      onChange={(event) => setCommentText(event.target.value)}
                      placeholder="Share an update"
                      rows={2}
                    />
                  </Field>
                  <Button
                    type="submit"
                    size="sm"
                    className="self-start"
                    loading={addComment.isPending}
                    disabled={commentText.trim().length === 0}
                  >
                    Add comment
                  </Button>
                </form>

                {comments.isPending ? (
                  <p
                    role="status"
                    className="text-caption text-muted-foreground"
                  >
                    Loading comments...
                  </p>
                ) : commentsError ? (
                  <p
                    role="alert"
                    className="text-caption font-medium text-danger"
                  >
                    {commentsError}
                  </p>
                ) : commentItems.length === 0 ? (
                  <p className="text-caption text-muted-foreground">
                    No comments yet.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {commentItems.map((comment) => (
                      <li
                        key={comment.id}
                        className="rounded-box border border-border p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-caption font-medium">
                              {nameOf(comment.userId)}
                            </p>
                            <p className="mt-1 text-body whitespace-pre-wrap">
                              {comment.content}
                            </p>
                            <p className="mt-1 text-footnote text-muted-foreground">
                              {formatDateTime(comment.createdAt)}
                            </p>
                          </div>
                          {canManage || comment.userId === currentUserId ? (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Delete comment by ${nameOf(comment.userId)}`}
                              onClick={() => removeComment.mutate(comment.id)}
                            >
                              <Trash2 aria-hidden="true" />
                            </Button>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section
                aria-labelledby="detail-links"
                className="flex flex-col gap-3"
              >
                <SectionHeading id="detail-links">
                  <Link2 aria-hidden="true" className="size-3.5" />
                  Links
                </SectionHeading>

                {addLinkError ? (
                  <p
                    role="alert"
                    className="text-caption font-medium text-danger"
                  >
                    {addLinkError}
                  </p>
                ) : null}

                <form
                  onSubmit={handleLinkSubmit}
                  className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <Field>
                    <FieldLabel className="sr-only">Link URL</FieldLabel>
                    <Input
                      type="url"
                      value={linkUrl}
                      onChange={(event) => setLinkUrl(event.target.value)}
                      placeholder="https://example.com/spec"
                    />
                  </Field>
                  <Field>
                    <FieldLabel className="sr-only">Link title</FieldLabel>
                    <Input
                      value={linkTitle}
                      onChange={(event) => setLinkTitle(event.target.value)}
                      placeholder="Specification"
                    />
                  </Field>
                  <Button
                    type="submit"
                    size="sm"
                    className="self-end"
                    loading={addLink.isPending}
                    disabled={
                      linkUrl.trim().length === 0 ||
                      linkTitle.trim().length === 0
                    }
                  >
                    Add link
                  </Button>
                </form>

                {links.isPending ? (
                  <p
                    role="status"
                    className="text-caption text-muted-foreground"
                  >
                    Loading links...
                  </p>
                ) : linksError ? (
                  <p
                    role="alert"
                    className="text-caption font-medium text-danger"
                  >
                    {linksError}
                  </p>
                ) : linkItems.length === 0 ? (
                  <p className="text-caption text-muted-foreground">
                    No links yet.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {linkItems.map((link) => (
                      <li
                        key={link.id}
                        className="flex items-start justify-between gap-3 rounded-box border border-border p-3"
                      >
                        <div className="min-w-0">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="rounded-box text-body font-medium text-link hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                          >
                            {link.title}
                          </a>
                          <p className="mt-0.5 truncate text-footnote text-muted-foreground">
                            {link.url}
                          </p>
                        </div>
                        {canManage || link.userId === currentUserId ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete link ${link.title}`}
                            onClick={() => removeLink.mutate(link.id)}
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section
                aria-labelledby="detail-history"
                className="flex flex-col gap-3"
              >
                <SectionHeading id="detail-history">
                  <History aria-hidden="true" className="size-3.5" />
                  History
                </SectionHeading>

                {history.isPending ? (
                  <p
                    role="status"
                    className="text-caption text-muted-foreground"
                  >
                    Loading history...
                  </p>
                ) : historyError ? (
                  <p
                    role="alert"
                    className="text-caption font-medium text-danger"
                  >
                    {historyError}
                  </p>
                ) : historyItems.length === 0 ? (
                  <p className="text-caption text-muted-foreground">
                    No changes recorded yet.
                  </p>
                ) : (
                  <ol className="flex flex-col gap-2">
                    {historyItems.map((entry) => (
                      <li key={entry.id} className="text-caption">
                        <span className="font-medium">
                          {nameOf(entry.userId)}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {historyActionLabel(entry.action)}
                        </span>
                        {entry.oldValue || entry.newValue ? (
                          <span className="text-muted-foreground">
                            {" "}
                            {entry.oldValue ?? "-"} to {entry.newValue ?? "-"}
                          </span>
                        ) : null}
                        <span className="block text-footnote text-muted-foreground">
                          {formatDateTime(entry.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </>
          )}
        </DialogBody>

        <DialogFooter>
          {editing ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="task-edit-form"
                loading={updateMutation.isPending}
              >
                Save changes
              </Button>
            </>
          ) : (
            <>
              {canUpdate ? (
                <Button type="button" variant="ghost" onClick={startEditing}>
                  <Pencil aria-hidden="true" />
                  Edit
                </Button>
              ) : null}
              {canManage ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-danger hover:text-danger"
                  onClick={() => setConfirmingDelete(true)}
                >
                  <Trash2 aria-hidden="true" />
                  Delete
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Done
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>

      <AlertDialog
        open={confirmingDelete}
        onOpenChange={handleConfirmingDeleteChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{task.title}&rdquo; and its comments, links and history
              will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError ? (
            <p role="alert" className="text-caption font-medium text-danger">
              {deleteError}
            </p>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                confirmDelete();
              }}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete task"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
