import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '@/lib/api/auth';
import { useAuth } from "@/features/auth/auth-context";

export function GithubCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithTokens } = useAuth();

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        const msg = errorDescription || error;
        navigate('/login?error=' + encodeURIComponent(msg));
        return;
      }

      if (!code) {
        navigate('/login?error=' + encodeURIComponent('Invalid callback: missing code'));
        return;
      }

      try {
        const result = await authApi.githubCallback(code);
        await loginWithTokens(result.token, result.refreshToken ?? "", result.user);
        navigate('/projects', { replace: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'GitHub sign in failed';
        navigate('/login?error=' + encodeURIComponent(message));
      }
    }
    handleCallback();
  }, [searchParams, navigate, loginWithTokens]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-body text-muted-foreground">Completing sign in with GitHub…</p>
      </div>
    </div>
  );
}