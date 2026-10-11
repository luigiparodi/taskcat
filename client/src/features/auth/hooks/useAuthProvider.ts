import * as React from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/lib/api/auth";
import { ApiError, configureApi, type StoredTokens } from "@/lib/api/client";
import { queryClient } from "@/lib/queryClient";
import type { AuthContextValue } from "@/features/auth/auth-context";

const STORAGE_KEY = "cat-task.tokens";

function readStoredTokens(): StoredTokens | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredTokens>;
    if (typeof parsed.token !== "string") return null;
    return {
      token: parsed.token,
      refreshToken:
        typeof parsed.refreshToken === "string" ? parsed.refreshToken : "",
    };
  } catch {
    return null;
  }
}

function writeStoredTokens(tokens: StoredTokens | null) {
  if (typeof window === "undefined") return;
  try {
    if (tokens) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    return;
  }
}

export function useAuthProvider(): AuthContextValue {
  const navigate = useNavigate();
  const [user, setUser] = React.useState<AuthContextValue["user"]>(null);
  const [status, setStatus] = React.useState<AuthContextValue["status"]>(() =>
    readStoredTokens() ? "loading" : "anonymous",
  );

  const clearSession = React.useCallback(() => {
    writeStoredTokens(null);
    queryClient.clear();
    setUser(null);
    setStatus("anonymous");
  }, []);

  React.useEffect(() => {
    configureApi({
      readTokens: readStoredTokens,
      refreshAccessToken: async () => {
        const stored = readStoredTokens();
        if (!stored?.refreshToken) return null;
        try {
          const rotated = await authApi.refresh(stored.refreshToken);
          writeStoredTokens(rotated);
          return rotated.token;
        } catch {
          writeStoredTokens(null);
          return null;
        }
      },
    });
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    const stored = readStoredTokens();
    if (!stored) return;

    authApi
      .me()
      .then((profile) => {
        if (cancelled) return;
        setUser(profile);
        setStatus("authenticated");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.isUnauthorized) {
          clearSession();
          return;
        }
        setUser(null);
        setStatus("anonymous");
      });

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const login = React.useCallback(async (email: string, password: string) => {
    const session = await authApi.login({ email, password });
    writeStoredTokens({
      token: session.token,
      refreshToken: session.refreshToken ?? "",
    });
    queryClient.clear();
    setUser(session.user);
    setStatus("authenticated");
  }, []);

  const register = React.useCallback(
    async (name: string, email: string, password: string) => {
      const session = await authApi.register({ name, email, password });
      writeStoredTokens({
        token: session.token,
        refreshToken: session.refreshToken ?? "",
      });
      queryClient.clear();
      setUser(session.user);
      setStatus("authenticated");
    },
    [],
  );

  const logout = React.useCallback(async () => {
    const stored = readStoredTokens();
    try {
      if (stored) {
        await authApi.logout(stored.refreshToken || undefined);
      }
    } catch {
      // Even if revocation fails, still clear the local session below.
    }
    clearSession();
    // Land on /login with no `from` state: a deliberate logout must not carry the
    // previous user's page into the next sign-in as a remembered redirect.
    navigate("/login", { replace: true });
  }, [clearSession, navigate]);

  const loginWithTokens = React.useCallback(
    async (token: string, refreshToken: string, user: AuthContextValue["user"]) => {
      writeStoredTokens({ token, refreshToken });
      queryClient.clear();
      setUser(user);
      setStatus("authenticated");
    },
    []
  );

  return React.useMemo<AuthContextValue>(
    () => ({ user, status, login, register, logout, authenticateWithTokens: loginWithTokens }),
    [user, status, login, register, logout, loginWithTokens],
  );
}

export type UseAuthProviderReturn = ReturnType<typeof useAuthProvider>;