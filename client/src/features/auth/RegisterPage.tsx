import * as React from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AtSign, Eye, EyeOff, KeyRound, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GitHubLoginButton } from "@/features/auth/OAuthButtons";
import { Field, FieldError, FieldHint, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AuthShell, FormError } from "@/features/auth/AuthShell";
import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { registerSchema, type RegisterValues } from "@/features/auth/schemas";

export function RegisterPage() {
  const { status, register } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirm: "" },
  });

  if (status === "authenticated") {
    return <Navigate to="/projects" replace />;
  }

  async function onSubmit(values: RegisterValues) {
    setFormError(null);
    setSubmitting(true);
    try {
      await register(values.name.trim(), values.email.trim(), values.password);
      navigate("/projects", { replace: true });
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : "Unable to create your account right now",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const nameError = form.formState.errors.name?.message;
  const emailError = form.formState.errors.email?.message;
  const passwordError = form.formState.errors.password?.message;
  const confirmError = form.formState.errors.confirm?.message;

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

          <Field invalid={Boolean(nameError)}>
            <FieldLabel>Name</FieldLabel>
            <Input
              type="text"
              autoComplete="name"
              placeholder="Ada Lovelace"
              startIcon={<User />}
              {...form.register("name")}
            />
            <FieldError>{nameError}</FieldError>
          </Field>

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
              {...form.register("password")}
            />
            <FieldHint>At least 8 characters.</FieldHint>
            <FieldError>{passwordError}</FieldError>
          </Field>

          <Field invalid={Boolean(confirmError)}>
            <FieldLabel>Confirm password</FieldLabel>
            <Input
              type={showConfirm ? "text" : "password"}
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
              {...form.register("confirm")}
            />
            <FieldError>{confirmError}</FieldError>
          </Field>

          <Button type="submit" size="lg" loading={submitting} className="w-full">
            Create account
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
