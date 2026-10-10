import * as React from "react"
import { cn } from "@/lib/utils"
import { CircleAlert } from "lucide-react"

type FieldContextValue = {
  id: string
  hintId: string
  errorId: string
  describedBy: string | undefined
  invalid: boolean
}

const FieldContext = React.createContext<FieldContextValue | null>(null)

function useField() {
  return React.useContext(FieldContext)
}

export const fieldControlClasses =
  "w-full rounded-box border border-input bg-surface-1 text-body text-foreground transition-[background-color,border-color,box-shadow] duration-150 ease-standard outline-none placeholder:text-muted-foreground hover:border-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-danger aria-invalid:hover:border-danger aria-invalid:focus-visible:border-danger aria-invalid:focus-visible:ring-danger/30"

function Field({
  className,
  invalid = false,
  id: idProp,
  children,
  ...props
}: React.ComponentProps<"div"> & { invalid?: boolean }) {
  const autoId = React.useId()
  const id = idProp ?? autoId
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  const value = React.useMemo(
    () => ({ id, hintId, errorId, describedBy: `${hintId} ${errorId}`, invalid }),
    [id, hintId, errorId, invalid]
  )

  return (
    <FieldContext.Provider value={value}>
      <div data-slot="field" data-invalid={invalid || undefined} className={cn("flex w-full flex-col gap-1.5", className)} {...props}>
        {children}
      </div>
    </FieldContext.Provider>
  )
}

function FieldLabel({ className, children, ...props }: React.ComponentProps<"label">) {
  const field = useField()

  return (
    <label data-slot="field-label" htmlFor={field?.id} className={cn("text-caption font-medium text-foreground", className)} {...props}>
      {children}
    </label>
  )
}

function FieldHint({ className, id: idProp, children, ...props }: React.ComponentProps<"p">) {
  const field = useField()

  return (
    <p id={idProp ?? field?.hintId} data-slot="field-hint" className={cn("text-caption text-muted-foreground empty:hidden", className)} {...props}>
      {children}
    </p>
  )
}

function FieldError({ className, id: idProp, children, ...props }: React.ComponentProps<"p">) {
  const field = useField()

  return (
    <p
      id={idProp ?? field?.errorId}
      data-slot="field-error"
      role="alert"
      className={cn(
        "flex items-start gap-1.5 text-caption font-medium text-danger empty:hidden",
        "[&_svg]:mt-px [&_svg]:size-3.5 [&_svg]:shrink-0",
        className
      )}
      {...props}
    >
      {children ? (
        <>
          <CircleAlert aria-hidden="true" />
          {children}
        </>
      ) : null}
    </p>
  )
}

export { Field, FieldContext, FieldError, FieldHint, FieldLabel, useField }