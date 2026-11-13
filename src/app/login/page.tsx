"use client";

import { Suspense, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { AuthLayout } from "@/components/layout";
import { Brandmark } from "@/components/layout/Navbar";
import { Button, Field, Input, useToast } from "@/components/ui";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_not_configured:
    "Google Sign-In is not currently configured on this environment. Please sign in with your email and password.",
  google_access_denied:
    "Google Sign-In was cancelled or access was denied.",
  invalid_request:
    "Invalid authentication request. Please try again.",
  state_expired:
    "Sign-in session expired. Please click Continue with Google again.",
  invalid_state:
    "Invalid authentication state. Please try again.",
  state_mismatch:
    "Security verification failed (state mismatch). Please try again.",
  unverified_google_email:
    "Your Google account email has not been verified by Google. Please verify it or log in with password.",
  account_deactivated:
    "This account has been deactivated. Please contact support.",
  auth_failed:
    "Google authentication could not be completed. Please try again.",
};

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { push } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const nextParam = search.get("next") || "";
  const errorParam = search.get("error");
  const oauthErrorMessage = useMemo(() => {
    if (!errorParam) return null;
    return (
      GOOGLE_ERROR_MESSAGES[errorParam] ||
      "An unexpected error occurred during Google Sign-In."
    );
  }, [errorParam]);

  function validate() {
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Enter a valid email address";
    if (!password) next.password = "Password is required";
    else if (password.length < 6)
      next.password = "Password must be at least 6 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrors({ form: json.message ?? "Unable to log in" });
        push({
          title: "Login failed",
          description: json.message,
          tone: "error",
        });
        return;
      }
      push({
        title: `Welcome back, ${json.data.user.fullName.split(" ")[0]}!`,
        description: "You are now signed in.",
        tone: "success",
      });
      const next = search.get("next");
      router.push(
        next ?? (json.data.user.role === "ADMIN" ? "/admin" : "/dashboard"),
      );
      router.refresh();
    } catch {
      setErrors({ form: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="mb-7">
        <Brandmark />
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">
        Welcome back
      </h1>
      <p className="mt-1.5 text-sm text-ink-500">
        Log in to continue your placement preparation.
      </p>

      {oauthErrorMessage && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-800">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p className="font-medium leading-relaxed">{oauthErrorMessage}</p>
        </div>
      )}

      <div className="mt-6">
        <GoogleSignInButton
          text="Continue with Google"
          nextUrl={nextParam}
        />
      </div>

      <div className="relative my-6 flex items-center justify-center">
        <div className="w-full border-t border-line" />
        <span className="absolute bg-white px-3 text-xs font-medium uppercase tracking-wider text-ink-500">
          or continue with email
        </span>
      </div>

      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <Field
          label="Email address"
          htmlFor="email"
          error={errors.email}
          required
        >
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500"
              aria-hidden
            />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@college.edu"
              className="pl-9"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          error={errors.password}
          required
        >
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500"
              aria-hidden
            />
            <Input
              id="password"
              name="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              className="px-9"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-900"
            >
              {show ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </Field>

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink-700">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="size-4 rounded border-line accent-brand-500"
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-bold text-brand-600 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {errors.form && (
          <p className="rounded-lg border border-error-500/20 bg-error-500/10 px-3 py-2 text-xs font-semibold text-error-500">
            {errors.form}
          </p>
        )}

        <Button type="submit" block size="lg" loading={loading}>
          Login
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-bold text-brand-600 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-white">
          <p className="text-sm text-ink-500">Loading…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
