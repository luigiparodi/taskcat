# GitHub OAuth Implementation — Software Design Document

## Overview
Implement "Sign in with GitHub" for the TaskCat app. The backend already has the token-exchange callback (`POST /auth/github/callback`). This SDD covers the missing pieces: the authorization-initiation endpoint, the frontend flow, and the development environment setup.

---

## 1. Architecture & Flow

```
┌─────────────┐     1. GET /auth/github       ┌─────────────┐
│   Browser   │ ─────────────────────────────▶ │   Server    │
└─────────────┘ ◀───────────────────────────── │  (302)      │
       │                                       └─────────────┘
       │ 2. Redirect to GitHub
       ▼
┌─────────────┐     3. User authorizes        ┌─────────────┐
│   GitHub    │ ─────────────────────────────▶ │   GitHub    │
│   OAuth     │ ◀───────────────────────────── │  (code)     │
└─────────────┘                                 └─────────────┘
       │
       │ 4. Redirect back to client
       ▼
┌─────────────┐     5. POST /auth/github/callback  ┌─────────────┐
│   Browser   │ ─────────────────────────────────▶ │   Server    │
│  (client)   │ { code }                            │  (tokens)   │
└─────────────┘ ◀───────────────────────────────── └─────────────┘
```

---

## 2. Server Changes

### 2.1 New Endpoint: `GET /auth/github`
**File:** `server/src/routes/auth.routes.ts` + `server/src/controllers/AuthController.ts`

```typescript
// AuthController.ts
export async function githubLoginHandler(req: Request, res: Response) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = `${process.env.FRONTEND_URL}/auth/github/callback`;
  const state = crypto.randomUUID(); // CSRF protection

  // Store state in short-lived cookie (httponly, secure, sameSite=lax)
  res.cookie('github_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000, // 10 min
  });

  const params = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri,
    scope: 'read:user user:email',
    state,
    allow_signup: 'true',
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
}
```

**Route registration (auth.routes.ts):**
```typescript
router.get('/github', githubLoginHandler);
```

**OpenAPI docs:** Add to the same file.

### 2.2 Callback Validation (existing `POST /auth/github/callback`)
- Validate `state` from cookie against query param (optional but recommended)
- Already implemented: exchanges `code` for tokens via `githubAuth(code)`

### 2.3 Environment Variables (Development)
| Variable | Value (dev) |
|---|---|
| `GITHUB_CLIENT_ID` | From GitHub OAuth App |
| `GITHUB_CLIENT_SECRET` | From GitHub OAuth App |
| `FRONTEND_URL` | `http://localhost:5173` |
| `NODE_ENV` | `development` |

### 2.4 Callback URL (GitHub OAuth App settings)
- **Development:** `http://localhost:5173/auth/github/callback`
- **Production:** `https://lp-taskcat.vercel.app/auth/github/callback`

---

## 3. Client Changes

### 3.1 New Route: `/auth/github/callback`
**File:** `client/src/App.tsx` (or router config)

```tsx
import { GithubCallbackPage } from '@/features/auth/pages/GithubCallbackPage';

// In router:
<Route path="/auth/github/callback" element={<GithubCallbackPage />} />
```

### 3.2 `GithubCallbackPage` Component
**File:** `client/src/features/auth/pages/GithubCallbackPage.tsx`

```tsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '@/lib/api/auth';
import { useAuth } from '@/features/auth/hooks/useAuthProvider';

export function GithubCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        // Handle GitHub OAuth errors (access_denied, etc.)
        navigate('/login?error=github_denied');
        return;
      }

      if (!code) {
        navigate('/login?error=invalid_callback');
        return;
      }

      try {
        const result = await authApi.githubCallback(code);
        login(result.token, result.refreshToken, result.user);
        navigate('/projects'); // or stored 'from' path
      } catch (err) {
        navigate('/login?error=github_failed');
      }
    }
    handleCallback();
  }, [searchParams, navigate, login]);

  return <div className="flex items-center justify-center h-screen">Completing sign in…</div>;
}
```

### 3.3 "Sign in with GitHub" Button
**File:** `client/src/features/auth/components/GitHubLoginButton.tsx`

```tsx
export function GitHubLoginButton({ className }: { className?: string }) {
  const apiBase = import.meta.env.VITE_API_BASE || '/api';
  const loginUrl = `${apiBase}/auth/github`; // proxied via Vercel rewrite or direct

  return (
    <a
      href={loginUrl}
      className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white text-gray-700 hover:bg-gray-50', className)}
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
      <span>Continue with GitHub</span>
    </a>
  );
}
```

### 3.4 Integration in Login Page
Add `<GitHubLoginButton />` to `client/src/features/auth/pages/LoginPage.tsx` (or wherever the login form lives).

### 3.5 `authApi.githubCallback` (already exists)
Already in `client/src/lib/api/auth.ts`:
```ts
githubCallback(code: string) {
  return api.post<SessionResult>('/auth/github/callback', { code }, { auth: false });
}
```

---

## 4. Data Model (User)
The existing `User` model in `server/src/models/User.ts` already supports `provider`, `providerId`, and `avatarUrl` fields (see `githubAuth` in AuthService). No schema change needed.

---

## 5. Security Considerations
- **State parameter:** Random UUID, stored in httpOnly cookie, validated on callback.
- **PKCE:** Not required for server-side flow (confidential client), but state is mandatory.
- **Scopes:** `read:user user:email` (minimum for email + profile).
- **Cookie settings:** `httpOnly`, `secure` in prod, `sameSite: 'lax'`, short TTL (10 min).
- **Rate limiting:** Existing `express-rate-limit` covers `/auth/*`.

---

## 6. Error Handling
| Scenario | Behavior |
|---|---|
| User denies consent | GitHub redirects with `?error=access_denied` → show friendly message |
| Invalid/expired code | Server returns 400 → client shows "Sign in failed" |
| Missing `GITHUB_CLIENT_ID` | Server returns 500 → log clearly |
| Email conflict (existing email/password account) | `githubAuth` links by email → merges account |

---

## 7. Testing Checklist (Dev)
- [ ] `GET /auth/github` redirects to GitHub with correct params
- [ ] GitHub redirects back to `/auth/github/callback?code=...`
- [ ] Client page extracts `code`, calls `POST /auth/github/callback`
- [ ] Server returns `token`, `refreshToken`, `user`
- [ ] Client stores tokens, redirects to `/projects`
- [ ] Subsequent requests work with access token
- [ ] Logout clears tokens

---

## 8. Rollout Plan
1. Create GitHub OAuth App (dev + prod) → get credentials
2. Add server `GET /auth/github` endpoint + env vars
3. Add client callback page + button
4. Test locally with `http://localhost:5173`
5. Deploy to Render/Vercel, update OAuth App callback URLs
6. Test production flow