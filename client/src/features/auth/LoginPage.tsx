import * as React from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AtSign, Eye, EyeOff, KeyRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AuthShell, FormError } from "@/features/auth/AuthShell";
import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { GitHubLoginButton } from "@/features/auth/OAuthButtons";
import { loginSchema, type LoginValues } from "@/features/auth/schemas";

export function LoginPage() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/projects";

  const TEST_ADMIN_EMAIL = "admin@taskcat.com";
  const TEST_ADMIN_PASSWORD = "qwerty123";

  const [showPassword, setShowPassword] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function fillTestAdmin() {
    form.setValue("email", TEST_ADMIN_EMAIL, { shouldValidate: true });
    form.setValue("password", TEST_ADMIN_PASSWORD, { shouldValidate: true });
    setFormError(null);
  }

  if (status === "authenticated") {
    return <Navigate to={from} replace />;
  }

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    setSubmitting(true);
    try {
      await login(values.email.trim(), values.password);
      navigate(from, { replace: true });
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Unable to sign in right now");
    } finally {
      setSubmitting(false);
    }
  }

  const emailError = form.formState.errors.email?.message;
  const passwordError = form.formState.errors.password?.message;

  return (
    <AuthShell
      title="Sign in to TaskCat"
      subtitle="Track your team's work in one place."
      footer={
        <>
          New here?{" "}
          <Link to="/register" className="text-link font-medium hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <GitHubLoginButton />
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-caption uppercase tracking-wider">
            <span className="bg-card px-3 text-muted-foreground">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
          <FormError message={formError} />

          <Field invalid={Boolean(emailError)}>
            <FieldLabel>Email</FieldLabel>
            <Input
              type="email"
              autoComplete="email"
              placeholder="ada@example.com"
              startIcon={<AtSign />}
              {...form.register("email")}
            />
            <FieldError>{emailError}</FieldError>
          </Field>

          <Field invalid={Boolean(passwordError)}>
            <FieldLabel>Password</FieldLabel>
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              startIcon={<KeyRound />}
              endSlot={
                <button
                  type="button"
                  className="inline-flex size-8 items-center justify-center rounded-box text-muted-foreground transition-colors duration-150 ease-standard outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" className="size-4" />
                  ) : (
                    <Eye aria-hidden="true" className="size-4" />
                  )}
                </button>
              }
              {...form.register("password")}
            />
            <FieldError>{passwordError}</FieldError>
          </Field>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-caption text-muted-foreground hover:text-foreground"
            onClick={fillTestAdmin}
          >
            Fill test admin (admin@taskcat.com / qwerty123)
          </Button>

          <Button type="submit" size="lg" loading={submitting} className="w-full">
            Sign in
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
