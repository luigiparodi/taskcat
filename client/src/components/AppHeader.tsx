import * as React from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils";

function AdminAreaSwitcher() {
  const location = useLocation();
  const isOnAdmin = location.pathname.startsWith("/admin");

  const segments = [
    { to: "/projects", label: "Projects" },
    { to: "/admin/projects", label: "Admin" },
  ];

  return (
    <div
      role="group"
      aria-label="Area"
      className="flex items-center gap-0.5 rounded-full border border-border-strong bg-surface-2 p-0.5"
    >
      {segments.map((segment) => {
        const active = segment.to.startsWith("/admin")
          ? isOnAdmin
          : !isOnAdmin;
        return (
          <NavLink
            key={segment.to}
            to={segment.to}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1 text-footnote font-medium transition-colors duration-150 ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {segment.label}
          </NavLink>
        );
      })}
    </div>
  );
}

export function AppHeader({
  title,
  subtitle,
  leading,
  actions,
  containerClassName,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  leading?: React.ReactNode;
  actions?: React.ReactNode;
  containerClassName?: string;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  async function handleSignOut() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="border-b border-border bg-surface-1">
      <div
        className={cn(
          "mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4",
          containerClassName,
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          {leading}
          <div className="min-w-0">
            <h1 className="truncate text-title-3 font-semibold">{title}</h1>
            {subtitle ? (
              <p className="text-caption text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {actions}

          {isAdmin ? <AdminAreaSwitcher /> : null}

          <DropdownMenu>
            <DropdownMenuTrigger aria-label="Account menu">
              <span className="max-w-40 truncate">
                {user?.name ?? "Account"}
              </span>
              <ChevronDown aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <span className="block">{user?.email ?? "Not signed in"}</span>
                {user ? (
                  <span className="block text-footnote font-normal text-muted-foreground">
                    {isAdmin ? "Administrator" : "Team member"}
                  </span>
                ) : null}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem onSelect={() => void handleSignOut()}>
                <LogOut aria-hidden="true" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export function BackToProjectsButton() {
  return (
    <Button asChild variant="ghost" size="icon" aria-label="Back to projects">
      <Link to="/projects">
        <ArrowLeft aria-hidden="true" />
      </Link>
    </Button>
  );
}