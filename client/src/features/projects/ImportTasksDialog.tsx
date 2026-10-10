import { useState } from "react";
import { useImportTasks } from "@/features/projects/hooks/useImportTasks";
import type { ImportTasksDialogProps } from "@/features/projects/hooks/useImportTasks";
import { ImportTasksView } from "@/features/projects/components/ImportTasksView";

export function ImportTasksDialog(
  props: Omit<ImportTasksDialogProps, "open" | "onOpenChange">,
) {
  const [open, setOpen] = useState(false);
  const h = useImportTasks({ ...props, open, onOpenChange: setOpen });
  return <ImportTasksView {...h} />;
}