import type * as React from "react";
import { AuthContext } from "@/features/auth/auth-context";
import { useAuthProvider } from "@/features/auth/hooks/useAuthProvider";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const value = useAuthProvider();
  return <AuthContext value={value}>{children}</AuthContext>;
}