import * as React from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AtSign, Eye, EyeOff, KeyRound } from "lucide-react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AuthShell, FormError } from "@/features/auth/AuthShell";
import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = { email?: string; password?: string };

export function LoginPage() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from ?? "/projects";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState<Errors>({});

  const [showPassword, setShowPassword] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (status === "authenticated") {
    return <Navigate to={from} replace />;
  }

  function validate(): Errors {
    const next: Errors = {};
    if (!EMAIL_REGEX.test(email.trim())) {
      next.email = "Enter a valid email address";
    }
    if (password.length === 0) {
      next.password = "Enter your password";
    }
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Unable to sign in right now",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Sign in to TaskCat"
      subtitle="Track your team's work in one place."
      footer={
        <>
          New here?{" "}
          <Link
            to="/register"
            className="text-link font-medium hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FormError message={formError} />

        <Field invalid={Boolean(errors.email)}>
          <FieldLabel>Email</FieldLabel>
          <Input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="ada@example.com"
            startIcon={<AtSign />}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <FieldError>{errors.email}</FieldError>
        </Field>

        <Field invalid={Boolean(errors.password)}>
          <FieldLabel>Password</FieldLabel>
          <Input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
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
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <FieldError>{errors.password}</FieldError>
        </Field>

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
