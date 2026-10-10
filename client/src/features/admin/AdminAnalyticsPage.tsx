import { useAdminAnalytics } from "@/features/admin/hooks/useAdminAnalytics";
import { AdminAnalyticsView } from "@/features/admin/components/AdminAnalyticsView";

export function AdminAnalyticsPage() {
  const h = useAdminAnalytics();

  return <AdminAnalyticsView {...h} />;
}