import { type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-9 text-center">
          <h1 className="text-pretty text-title-2 font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-body text-muted-foreground">{subtitle}</p>
        </div>

        <Card className="border-border bg-card shadow-sm">
          <CardContent className="flex flex-col gap-5">{children}</CardContent>
        </Card>

        {footer ? (
          <div className="mt-6 text-center text-body text-muted-foreground">{footer}</div>
        ) : null}
      </div>
    </main>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-box border border-danger-border bg-danger-subtle px-3 py-2 text-caption font-medium text-danger"
    >
      {message}
    </p>
  );
}
