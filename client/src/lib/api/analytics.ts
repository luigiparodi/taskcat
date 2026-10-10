import { api } from "@/lib/api/client";
import type { AdminAnalytics } from "@/lib/api/types";

export const analyticsApi = {
  get() {
    return api.get<AdminAnalytics>("/admin/analytics");
  },
};