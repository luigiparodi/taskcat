import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex shrink-0 items-center gap-1.5 rounded-button border border-transparent font-medium whitespace-nowrap transition-colors duration-150 ease-standard [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-muted-foreground border-border",
        info: "bg-info-subtle text-info-on-subtle",
        success: "bg-success-subtle text-success-on-subtle",
        warning: "bg-warning-subtle text-warning-on-subtle",
        danger: "bg-danger-subtle text-danger-on-subtle",
        primary: "bg-accent-soft text-accent-soft-foreground",
      },
      size: {
        sm: "h-5 px-2 text-footnote has-data-[dot]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        default:
          "h-6 px-2.5 text-caption has-data-[dot]:px-2 [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
    defaultVariants: {
      tone: "neutral",
      size: "default",
    },
  }
)

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    dot?: boolean
  }

function Badge({ className, tone, size, dot = false, children, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      data-tone={tone}
      data-size={size}
      data-dot={dot || undefined}
      className={cn(badgeVariants({ tone, size, className }))}
      {...props}
    >
      {dot ? (
        <span
          data-slot="badge-dot"
          aria-hidden="true"
          className="size-1.5 rounded-full bg-current opacity-70"
        />
      ) : null}
      {children}
    </span>
  )
}

type TaskStatus = "pending" | "working" | "finished"
type TaskPriority = "low" | "medium" | "high" | "urgent"

const STATUS_TONE: Record<TaskStatus, NonNullable<BadgeProps["tone"]>> = {
  pending: "neutral",
  working: "info",
  finished: "success",
}

const PRIORITY_TONE: Record<TaskPriority, NonNullable<BadgeProps["tone"]>> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  urgent: "danger",
}

const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: "Pending",
  working: "In progress",
  finished: "Finished",
}

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
}

type ToneProps = Omit<BadgeProps, "tone" | "children">

function StatusBadge({
  status,
  label,
  ...props
}: ToneProps & { status: TaskStatus; label?: string }) {
  return (
    <Badge tone={STATUS_TONE[status]} {...props}>
      {label ?? STATUS_LABEL[status]}
    </Badge>
  )
}

function PriorityBadge({
  priority,
  label,
  ...props
}: ToneProps & { priority: TaskPriority; label?: string }) {
  return (
    <Badge tone={PRIORITY_TONE[priority]} {...props}>
      {label ?? PRIORITY_LABEL[priority]}
    </Badge>
  )
}

export {
  Badge,
  badgeVariants,
  StatusBadge,
  PriorityBadge,
  type BadgeProps,
  type TaskStatus,
  type TaskPriority,
}