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
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#050507] px-6 py-16">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-linear-to-b from-[#0b0d13] via-[#050507] to-[#070711]" />
        <div className="apple-drift absolute left-1/2 top-[10%] h-[62vh] w-[85vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(82_118_196/0.3),transparent_72%)] blur-[80px]" />
        <div className="apple-drift-b absolute bottom-[-30%] right-[-18%] h-[72vh] w-[72vw] rounded-full bg-[radial-gradient(closest-side,rgb(134_118_214/0.17),transparent_72%)] blur-[96px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_82%_70%_at_50%_40%,transparent_55%,rgb(0_0_0/0.6))]" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="mb-9 text-center">
          <h1 className="text-pretty text-title-2 font-semibold tracking-tight text-white">
            {title}
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-body text-white/70">
            {subtitle}
          </p>
        </div>

        <Card className="border-white/8 bg-white/6 shadow-2xl shadow-black/50 backdrop-blur-2xl backdrop-saturate-150">
          <CardContent className="flex flex-col gap-5">{children}</CardContent>
        </Card>

        {footer ? (
          <div className="mt-6 text-center text-body text-white/70">
            {footer}
          </div>
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