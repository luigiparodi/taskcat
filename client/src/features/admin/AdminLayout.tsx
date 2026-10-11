import { NavLink, Outlet } from "react-router-dom";
import { AppHeader, BackToProjectsButton } from "@/components/AppHeader";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { to: "/admin/projects", label: "Projects" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/analytics", label: "Analytics" },
];

export function AdminLayout() {
  return (
    <>
      <AppHeader
        title="Admin"
        subtitle="Global administration"
        leading={<BackToProjectsButton />}
      />

      <div className="mx-auto max-w-6xl px-6 py-8">
        <nav aria-label="Admin sections" className="mb-6 flex gap-2">
          {SECTIONS.map((section) => (
            <NavLink
              key={section.to}
              to={section.to}
              className={({ isActive }) =>
                cn(
                  "rounded-box px-3 py-1.5 text-body font-medium transition-colors duration-150 ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              {section.label}
            </NavLink>
          ))}
        </nav>

        <Outlet />
      </div>
    </>
  );
}
