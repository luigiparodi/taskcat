import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Slot } from "radix-ui";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-button border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-standard outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 active:not-aria-[haspopup]:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-busy:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-secondary-active",
        outline:
          "border-border-strong bg-background text-foreground hover:bg-muted active:bg-secondary-hover",
        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground active:bg-secondary-hover",
        destructive:
          "border-danger-border bg-danger-subtle text-danger hover:border-danger hover:bg-danger-subtle",
        "destructive-solid":
          "bg-danger text-destructive-foreground hover:bg-danger-hover active:bg-danger-active",
        link: "text-link underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 gap-1.5 px-3 text-caption has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        default:
          "h-9 gap-2 px-4 text-body has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-4",
        lg: "h-11 gap-2 px-5 text-body-lg has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4 [&_svg:not([class*='size-'])]:size-5",
        "icon-sm": "size-8 rounded-box [&_svg:not([class*='size-'])]:size-4",
        icon: "size-9 rounded-box [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-11 rounded-box [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      aria-busy={loading || undefined}
      disabled={asChild ? undefined : loading || props.disabled}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading ? (
        <>
          <Loader2
            data-slot="button-spinner"
            aria-hidden="true"
            className="animate-spin motion-reduce:animate-none"
          />
          {children}
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button, buttonVariants };