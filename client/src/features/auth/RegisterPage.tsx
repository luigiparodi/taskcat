import * as React from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AtSign, Eye, EyeOff, KeyRound, User } from "lucide-react";
import { GitHubLoginButton } from "@/features/auth/GitHubLoginButton";
import {
  Field,
  FieldError,
  FieldHint,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AuthShell, FormError } from "@/features/auth/AuthShell";
import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

type Errors = {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
};

export function RegisterPage() {
  const { status, register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [errors, setErrors] = React.useState<Errors>({});

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (status === "authenticated") {
    return <Navigate to="/projects" replace />;
  }

  function validate(): Errors {
    const next: Errors = {};
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      next.name = "Name must be between 2 and 50 characters";
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      next.email = "Enter a valid email address";
    }
    if (password.length < MIN_PASSWORD) {
      next.password = `Password must be at least ${MIN_PASSWORD} characters`;
    }
    if (confirm !== password) {
      next.confirm = "Passwords do not match";
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
      await register(name.trim(), email.trim(), password);
      navigate("/projects", { replace: true });
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Unable to create your account right now",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start organising projects and tasks."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-link font-medium hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FormError message={formError} />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <GitHubLoginButton className="w-full" />

        <Field invalid={Boolean(errors.name)}>
          <FieldLabel>Name</FieldLabel>
          <Input
            type="text"
            name="name"
            autoComplete="name"
            placeholder="Ada Lovelace"
            startIcon={<User />}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <FieldError>{errors.name}</FieldError>
        </Field>

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
            autoComplete="new-password"
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
          <FieldHint>At least {MIN_PASSWORD} characters.</FieldHint>
          <FieldError>{errors.password}</FieldError>
        </Field>

        <Field invalid={Boolean(errors.confirm)}>
          <FieldLabel>Confirm password</FieldLabel>
          <Input
            type={showConfirm ? "text" : "password"}
            name="confirm"
            autoComplete="new-password"
            startIcon={<KeyRound />}
            endSlot={
              <button
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-box text-muted-foreground transition-colors duration-150 ease-standard outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
                onClick={() => setShowConfirm((prev) => !prev)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                aria-pressed={showConfirm}
              >
                {showConfirm ? (
                  <EyeOff aria-hidden="true" className="size-4" />
                ) : (
                  <Eye aria-hidden="true" className="size-4" />
                )}
              </button>
            }
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
          <FieldError>{errors.confirm}</FieldError>
        </Field>

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
