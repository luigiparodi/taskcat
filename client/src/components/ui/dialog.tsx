import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const dialogOverlayClass =
  "fixed inset-0 z-50 bg-overlay data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 motion-reduce:animate-none"

const dialogContentVariants = cva(
  "fixed z-50 flex w-full flex-col overflow-hidden border-border bg-popover text-popover-foreground shadow-dialog outline-none data-[state=open]:animate-in data-[state=closed]:animate-out motion-reduce:animate-none inset-x-0 bottom-0 max-h-[85dvh] rounded-t-card border-t data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-4 sm:inset-0 sm:my-auto sm:mx-auto sm:h-fit sm:max-h-[85vh] sm:rounded-card sm:border sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:zoom-out-95",
  {
    variants: {
      size: {
        sm: "sm:max-w-sm",
        default: "sm:max-w-lg",
        lg: "sm:max-w-2xl",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const DialogTitleContext = React.createContext<{ titleId: string; descriptionId: string } | null>(
  null
)

function useDialogLabels() {
  const context = React.useContext(DialogTitleContext)
  if (!context) {
    throw new Error("DialogTitle and DialogDescription must be rendered inside DialogContent")
  }
  return context
}

function Dialog(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogPortal(props: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(dialogOverlayClass, className)}
      {...props}
    />
  )
}

type DialogContentProps = React.ComponentProps<typeof DialogPrimitive.Content> &
  VariantProps<typeof dialogContentVariants> & {
    showCloseButton?: boolean
  }

function DialogContent({
  className,
  size,
  children,
  showCloseButton = true,
  ...props
}: DialogContentProps) {
  const generatedId = React.useId()
  const labels = React.useMemo(
    () => ({
      titleId: `${generatedId}-title`,
      descriptionId: `${generatedId}-description`,
    }),
    [generatedId]
  )

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        data-size={size}
        aria-labelledby={labels.titleId}
        aria-describedby={labels.descriptionId}
        className={cn(dialogContentVariants({ size, className }))}
        {...props}
      >
        <DialogTitleContext.Provider value={labels}>{children}</DialogTitleContext.Provider>
        {showCloseButton ? (
          <DialogPrimitive.Close
            data-slot="dialog-close-button"
            className="absolute top-4 right-4 inline-flex size-8 shrink-0 items-center justify-center rounded-box text-muted-foreground transition-colors duration-150 ease-standard outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50"
          >
            <X aria-hidden="true" className="size-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex shrink-0 flex-col gap-1 border-b border-border px-6 py-4 pr-14",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  const { titleId } = useDialogLabels()
  return (
    <DialogPrimitive.Title
      id={titleId}
      data-slot="dialog-title"
      className={cn("text-title-3 leading-tight font-semibold text-balance", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  const { descriptionId } = useDialogLabels()
  return (
    <DialogPrimitive.Description
      id={descriptionId}
      data-slot="dialog-description"
      className={cn("text-body text-muted-foreground text-pretty", className)}
      {...props}
    />
  )
}

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5",
        className
      )}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex shrink-0 flex-col-reverse gap-2 border-t border-border px-6 py-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  dialogContentVariants,
  dialogOverlayClass,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  type DialogContentProps,
}