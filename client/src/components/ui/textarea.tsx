import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { fieldControlClasses, useField } from "@/components/ui/field"

const textareaVariants = cva(fieldControlClasses, {
  variants: {
    size: {
      sm: "px-2.5 py-1.5 text-caption",
      default: "px-3 py-2",
      lg: "px-4 py-3 text-body-lg",
    },
    resize: {
      none: "resize-none",
      vertical: "resize-y",
      both: "resize",
    },
  },
  defaultVariants: {
    size: "default",
    resize: "vertical",
  },
})

function Textarea({
  className,
  size = "default",
  resize = "vertical",
  id: idProp,
  "aria-describedby": describedByProp,
  "aria-invalid": invalidProp,
  ...props
}: React.ComponentProps<"textarea"> & VariantProps<typeof textareaVariants>) {
  const field = useField()

  return (
    <textarea
      id={idProp ?? field?.id}
      aria-invalid={invalidProp ?? (field?.invalid || undefined)}
      aria-describedby={describedByProp ?? field?.describedBy}
      data-slot="textarea"
      data-size={size}
      className={cn(textareaVariants({ size, resize }), "min-h-20", className)}
      {...props}
    />
  )
}

export { Textarea, textareaVariants }