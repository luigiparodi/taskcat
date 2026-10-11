import * as React from "react";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import {
  dialogContentVariants,
  dialogOverlayClass,
} from "@/components/ui/dialog";

const AlertDialogTitleContext = React.createContext<{
  titleId: string;
  descriptionId: string;
} | null>(null);

function useAlertDialogLabels() {
  const context = React.useContext(AlertDialogTitleContext);
  if (!context) {
    throw new Error(
      "AlertDialogTitle and AlertDialogDescription must be rendered inside AlertDialogContent",
    );
  }
  return context;
}

function AlertDialog(
  props: React.ComponentProps<typeof AlertDialogPrimitive.Root>,
) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger(
  props: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>,
) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  );
}

function AlertDialogPortal(
  props: React.ComponentProps<typeof AlertDialogPrimitive.Portal>,
) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  );
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(dialogOverlayClass, className)}
      {...props}
    />
  );
}

type AlertDialogContentProps = React.ComponentProps<
  typeof AlertDialogPrimitive.Content
>;

function AlertDialogContent({
  className,
  children,
  ...props
}: AlertDialogContentProps) {
  const generatedId = React.useId();
  const labels = React.useMemo(
    () => ({
      titleId: `${generatedId}-title`,
      descriptionId: `${generatedId}-description`,
    }),
    [generatedId],
  );

  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        aria-labelledby={labels.titleId}
        aria-describedby={labels.descriptionId}
        className={cn(dialogContentVariants({ size: "sm", className }))}
        {...props}
      >
        <AlertDialogTitleContext.Provider value={labels}>
          {children}
        </AlertDialogTitleContext.Provider>
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex shrink-0 flex-col gap-2 px-6 py-5", className)}
      {...props}
    />
  );
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  const { titleId } = useAlertDialogLabels();
  return (
    <AlertDialogPrimitive.Title
      id={titleId}
      data-slot="alert-dialog-title"
      className={cn(
        "text-title-3 leading-tight font-semibold text-balance",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  const { descriptionId } = useAlertDialogLabels();
  return (
    <AlertDialogPrimitive.Description
      id={descriptionId}
      data-slot="alert-dialog-description"
      className={cn("text-body text-muted-foreground text-pretty", className)}
      {...props}
    />
  );
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex shrink-0 flex-col-reverse gap-2 border-t border-border px-6 py-4 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

type AlertDialogActionProps = React.ComponentProps<
  typeof AlertDialogPrimitive.Action
> & {
  variant?: "default" | "destructive";
};

function AlertDialogAction({
  className,
  variant = "default",
  ...props
}: AlertDialogActionProps) {
  return (
    <AlertDialogPrimitive.Action
      data-slot="alert-dialog-action"
      className={cn(
        variant === "destructive"
          ? "px-4 py-2 rounded-box bg-danger text-destructive-foreground hover:bg-danger-hover active:bg-danger-active"
          : "px-4 py-2 rounded-box bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      data-slot="alert-dialog-cancel"
      className={cn(
        "px-4 py-2 rounded-box bg-background text-foreground hover:bg-muted active:bg-secondary-hover",
        className,
      )}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  type AlertDialogContentProps,
};
