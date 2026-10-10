import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { fieldControlClasses, useField } from "@/components/ui/field";

const inputVariants = cva(fieldControlClasses, {
  variants: {
    size: {
      sm: "h-8 px-2.5 text-caption",
      default: "h-9 px-3",
      lg: "h-11 px-4 text-body-lg",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

const startIconPadding = { sm: "pl-8", default: "pl-9", lg: "pl-11" } as const;
const endSlotPadding = { sm: "pr-8", default: "pr-9", lg: "pr-11" } as const;

const iconClasses = cva(
  "pointer-events-none absolute inset-y-0 flex shrink-0 items-center justify-center text-muted-foreground/70",
  {
    variants: {
      slot: {
        start: "left-0",
        end: "right-0",
      },
      size: {
        sm: "w-8 [&_svg:not([class*='size-'])]:size-3.5",
        default: "w-9 [&_svg:not([class*='size-'])]:size-4",
        lg: "w-11 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      slot: "start",
      size: "default",
    },
  },
);

function Input({
  className,
  size = "default",
  startIcon,
  endSlot,
  id: idProp,
  "aria-describedby": describedByProp,
  "aria-invalid": invalidProp,
  ...props
}: Omit<React.ComponentProps<"input">, "size"> &
  VariantProps<typeof inputVariants> & {
    startIcon?: React.ReactNode;
    endSlot?: React.ReactNode;
  }) {
  const field = useField();

  return (
    <div
      data-slot="input"
      data-icon-start={startIcon ? "" : undefined}
      data-icon-end={endSlot ? "" : undefined}
      className="relative w-full"
    >
      {startIcon ? (
        <span
          data-slot="input-icon"
          aria-hidden="true"
          className={iconClasses({ size })}
        >
          {startIcon}
        </span>
      ) : null}
      <input
        id={idProp ?? field?.id}
        aria-invalid={invalidProp ?? (field?.invalid || undefined)}
        aria-describedby={describedByProp ?? field?.describedBy}
        data-slot="input-control"
        data-size={size}
        className={cn(
          inputVariants({ size }),
          startIcon ? startIconPadding[size ?? "default"] : undefined,
          endSlot ? endSlotPadding[size ?? "default"] : undefined,
          className,
        )}
        {...props}
      />
      {endSlot ? (
        <span
          data-slot="input-suffix"
          className={cn(
            iconClasses({ slot: "end", size }),
            "pointer-events-auto",
          )}
        >
          {endSlot}
        </span>
      ) : null}
    </div>
  );
}

export { Input, inputVariants };