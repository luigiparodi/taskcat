import { FileText, Sparkles, Trash2, Upload } from "lucide-react";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { useImportTasks } from "@/features/projects/hooks/useImportTasks";

type ImportTasksViewProps = ReturnType<typeof useImportTasks>;

export function ImportTasksView({
  open,
  onOpenChange,
  members,
  PRIORITIES,
  NO_ASSIGNEE,
  source,
  handleSourceChange,
  markdown,
  setMarkdown,
  file,
  fileKind,
  handleFileChange,
  preview,
  extractError,
  isServiceBusy,
  createError,
  isExtracting,
  isCreating,
  canCreate,
  handleExtract,
  handleCreate,
  handleStartOver,
  updatePreviewAt,
  removePreviewAt,
}: ImportTasksViewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Sparkles aria-hidden="true" />
          AI import
        </Button>
      </DialogTrigger>

      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Import tasks with AI</DialogTitle>
          <DialogDescription>
            Paste a requirements document or upload a file. Review the extracted
            tasks before creating them.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-4">
          {preview ? (
            <PreviewList
              preview={preview}
              members={members}
              PRIORITIES={PRIORITIES}
              NO_ASSIGNEE={NO_ASSIGNEE}
              updatePreviewAt={updatePreviewAt}
              removePreviewAt={removePreviewAt}
            />
          ) : (
            <ImportSource
              source={source}
              handleSourceChange={handleSourceChange}
              markdown={markdown}
              setMarkdown={setMarkdown}
              file={file}
              fileKind={fileKind}
              handleFileChange={handleFileChange}
            />
          )}

{preview ? null : extractError ? (
              <div
                role={isServiceBusy ? "status" : "alert"}
                className={
                  isServiceBusy
                    ? "flex flex-col gap-2 rounded-box border border-warning-border bg-warning-subtle px-3 py-2 text-caption font-medium text-warning-on-subtle"
                    : "rounded-box border border-danger-border bg-danger-subtle px-3 py-2 text-caption font-medium text-danger"
                }
              >
                <p>{extractError}</p>
                {isServiceBusy ? (
                  <p className="text-muted-foreground">
                    Nothing was lost - your document is still here. Give it a few
                    seconds and try again.
                  </p>
                ) : null}
              </div>
            ) : null}

          {createError ? (
            <p
              role="alert"
              className="rounded-box border border-danger-border bg-danger-subtle px-3 py-2 text-caption font-medium text-danger"
            >
              {createError}
            </p>
          ) : null}
        </DialogBody>

        <DialogFooter>
          {preview ? (
            <>
              <Button type="button" variant="ghost" onClick={handleStartOver}>
                Start over
              </Button>
              <Button
                type="button"
                loading={isCreating}
                disabled={!canCreate}
                onClick={handleCreate}
              >
                Create {preview.length}{" "}
                {preview.length === 1 ? "task" : "tasks"}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="button" loading={isExtracting} onClick={handleExtract}>
                {isExtracting ? "Extracting tasks" : "Extract tasks"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportSource({
  source,
  handleSourceChange,
  markdown,
  setMarkdown,
  file,
  fileKind,
  handleFileChange,
}: Pick<
  ImportTasksViewProps,
  | "source"
  | "handleSourceChange"
  | "markdown"
  | "setMarkdown"
  | "file"
  | "fileKind"
  | "handleFileChange"
>) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2" role="group" aria-label="Import source">
        <Button
          type="button"
          variant={source === "markdown" ? "secondary" : "ghost"}
          aria-pressed={source === "markdown"}
          onClick={() => handleSourceChange("markdown")}
        >
          <FileText aria-hidden="true" />
          Paste markdown
        </Button>
        <Button
          type="button"
          variant={source === "file" ? "secondary" : "ghost"}
          aria-pressed={source === "file"}
          onClick={() => handleSourceChange("file")}
        >
          <Upload aria-hidden="true" />
          Upload file
        </Button>
      </div>

      {source === "markdown" ? (
        <Field>
          <FieldLabel htmlFor="import-markdown">Requirements</FieldLabel>
          <Textarea
            id="import-markdown"
            value={markdown}
            onChange={(event) => setMarkdown(event.target.value)}
            placeholder="Paste the client brief, meeting notes or a spec..."
            rows={8}
          />
        </Field>
      ) : (
        <Field>
          <FieldLabel htmlFor="import-file">Document</FieldLabel>
          <div className="relative flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border-strong bg-surface-1 p-6 text-center hover:border-primary/50 transition-colors">
            <input
              id="import-file"
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <Upload className="size-6 text-muted-foreground" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <p className="text-body font-medium">
                {file ? file.name : "Choose a file or drag it here"}
              </p>
              <p className="text-caption text-muted-foreground">
                {file
                  ? fileKind
                    ? `${fileKind.toUpperCase()} file selected`
                    : "Not a supported file type"
                  : "PDF or DOCX, up to 10 MB"}
              </p>
            </div>
          </div>
        </Field>
      )}
    </div>
  );
}

function PreviewList({
  preview,
  members,
  PRIORITIES,
  NO_ASSIGNEE,
  updatePreviewAt,
  removePreviewAt,
}: Pick<
  ImportTasksViewProps,
  | "preview"
  | "members"
  | "PRIORITIES"
  | "NO_ASSIGNEE"
  | "updatePreviewAt"
  | "removePreviewAt"
>) {
  if (!preview) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-caption text-muted-foreground">
        {preview.length} {preview.length === 1 ? "task" : "tasks"} extracted.
        Edit or remove any before creating.
      </p>

      <ul className="flex flex-col gap-4">
        {preview.map((task, index) => {
          const id = `import-task-${index}`;
          return (
            <li
              key={index}
              className="flex flex-col gap-3 rounded-card border border-border bg-surface-1 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-caption font-medium text-muted-foreground">
                  Task {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove task ${index + 1}`}
                  onClick={() => removePreviewAt(index)}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>

              <Field>
                <FieldLabel htmlFor={`${id}-title`}>
                  Task {index + 1} title
                </FieldLabel>
                <Input
                  id={`${id}-title`}
                  value={task.title}
                  onChange={(event) =>
                    updatePreviewAt(index, { title: event.target.value })
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor={`${id}-description`}>
                  Task {index + 1} description
                </FieldLabel>
                <Textarea
                  id={`${id}-description`}
                  value={task.description ?? ""}
                  rows={2}
                  onChange={(event) =>
                    updatePreviewAt(index, {
                      description: event.target.value || null,
                    })
                  }
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor={`${id}-priority`}>
                    Task {index + 1} priority
                  </FieldLabel>
                  <Select
                    value={task.priority}
                    onValueChange={(value) =>
                      updatePreviewAt(index, {
                        priority: value as (typeof PRIORITIES)[number]["value"],
                      })
                    }
                  >
                    <SelectTrigger id={`${id}-priority`}>
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
                  <FieldLabel htmlFor={`${id}-assignee`}>
                    Task {index + 1} assignee
                  </FieldLabel>
                  <Select
                    value={task.assignedTo ?? NO_ASSIGNEE}
                    onValueChange={(value) =>
                      updatePreviewAt(index, {
                        assignedTo: value === NO_ASSIGNEE ? null : value,
                      })
                    }
                  >
                    <SelectTrigger id={`${id}-assignee`}>
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
                  {!task.assignedTo && task.suggestedAssignee ? (
                    <p className="text-caption text-muted-foreground">
                      Suggested: {task.suggestedAssignee}
                    </p>
                  ) : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor={`${id}-due`}>
                    Task {index + 1} due date
                  </FieldLabel>
                  <Input
                    id={`${id}-due`}
                    type="date"
                    value={task.endDate ?? ""}
                    onChange={(event) =>
                      updatePreviewAt(index, {
                        endDate: event.target.value || null,
                      })
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor={`${id}-hours`}>
                    Task {index + 1} estimated hours
                  </FieldLabel>
                  <Input
                    id={`${id}-hours`}
                    type="number"
                    min={0}
                    step={0.5}
                    value={task.estimatedHours ?? ""}
                    onChange={(event) =>
                      updatePreviewAt(index, {
                        estimatedHours:
                          event.target.value === ""
                            ? null
                            : Number(event.target.value),
                      })
                    }
                  />
                </Field>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}