import { cn } from "@/lib/utils";

const buttonBase =
  "inline-flex items-center justify-center gap-3 w-full h-11 rounded-box font-medium text-body transition-[background-color,border-color,color,box-shadow] duration-150 ease-standard outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

export function GitHubLoginButton({ className }: { className?: string }) {
  const apiBase = import.meta.env.VITE_API_BASE || "/api";
  const loginUrl = `${apiBase}/auth/github`;

  return (
    <a
      href={loginUrl}
      className={cn(
        buttonBase,
        "bg-gray-900 text-white border-gray-800 hover:bg-gray-800",
        className,
      )}
      aria-label="Continue with GitHub"
    >
      <svg
        className="size-5"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
        />
      </svg>
      <span>Continue with GitHub</span>
    </a>
  );
}