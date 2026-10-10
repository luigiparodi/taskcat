import { api } from "@/lib/api/client";
import type {
  PublicUser,
  RefreshResult,
  SessionResult,
} from "@/lib/api/types";

interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface LogoutResult {
  success: boolean;
}

export const authApi = {
  register(input: RegisterInput) {
    return api.post<SessionResult>("/auth/register", input, { auth: false });
  },
  login(input: LoginInput) {
    return api.post<SessionResult>("/auth/login", input, { auth: false });
  },
  logout(refreshToken?: string) {
    return api.post<LogoutResult>("/auth/logout", refreshToken ? { refreshToken } : undefined);
  },
  githubCallback(code: string) {
    return api.post<SessionResult>("/auth/github/callback", { code }, { auth: false });
  },
  refresh(refreshToken: string) {
    return api.post<RefreshResult>("/auth/refresh", { refreshToken }, { auth: false });
  },
  me() {
    return api.get<PublicUser>("/auth/me");
  },
  changePassword(currentPassword: string, newPassword: string) {
    return api.post<LogoutResult>("/auth/change-password", { currentPassword, newPassword });
  },
};
