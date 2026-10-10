import * as React from "react"
import { cn } from "@/lib/utils"

type CardProps = React.ComponentProps<"div"> & {
  interactive?: boolean
  selected?: boolean
  dragging?: boolean
}

function Card({
  className,
  interactive = false,
  selected = false,
  dragging = false,
  ...props
}: CardProps) {
  return (
    <div
      data-slot="card"
      data-interactive={interactive || undefined}
      data-selected={selected || undefined}
      data-dragging={dragging || undefined}
      aria-selected={selected || undefined}
      className={cn(
        "relative flex flex-col gap-3 rounded-card border border-border bg-surface-1 p-4 text-card-foreground shadow-card transition-[box-shadow,border-color,transform,opacity] duration-150 ease-standard",
        interactive &&
          "cursor-pointer hover:border-border-strong hover:shadow-card-hover focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none active:scale-[0.99]",
        selected && "border-ring ring-3 ring-ring/40",
        dragging && "scale-[0.98] opacity-60 shadow-none",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex items-start justify-between gap-3", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("text-heading leading-snug font-semibold text-balance", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-caption text-muted-foreground line-clamp-2 text-pretty", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("min-w-0", className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center justify-between gap-3 border-t border-border pt-3",
        className
      )}
      {...props}
    />
  )
}

function CardBadgeRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-badge-row"
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardBadgeRow,
  type CardProps,
}