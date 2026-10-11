import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/auth-context";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { ProjectsPage } from "@/features/projects/ProjectsPage";
import { AdminLayout } from "@/features/admin/AdminLayout";
import { Footer } from "@/components/Footer";

const BoardPage = lazy(() =>
  import("@/features/projects/BoardPage").then((module) => ({ default: module.BoardPage }))
);

const AdminProjectsPage = lazy(() =>
  import("@/features/admin/AdminProjectsPage").then((module) => ({
    default: module.AdminProjectsPage,
  }))
);

const AdminUsersPage = lazy(() =>
  import("@/features/admin/AdminUsersPage").then((module) => ({
    default: module.AdminUsersPage,
  }))
);

const AdminAnalyticsPage = lazy(() =>
  import("@/features/admin/AdminAnalyticsPage").then((module) => ({
    default: module.AdminAnalyticsPage,
  }))
);

function FullPageMessage({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6">
      <p className="text-body text-muted-foreground">{title}</p>
      {detail ? <span className="sr-only">{detail}</span> : null}
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <FullPageMessage title="Loading your workspace" />;
  }

  if (status === "anonymous") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <FullPageMessage title="Loading your workspace" />;
  }

  if (status === "anonymous") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/projects" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Suspense fallback={<FullPageMessage title="Loading" />}>
      <div className="min-h-screen bg-background">
        <main className="pb-20">
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/projects"
            element={
              <RequireAuth>
                <ProjectsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/projects/:projectId"
            element={
              <RequireAuth>
                <BoardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<Navigate to="/admin/projects" replace />} />
            <Route path="projects" element={<AdminProjectsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/projects" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Suspense>
  );
}