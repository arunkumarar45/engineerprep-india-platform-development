"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";
import { AuthLayout } from "@/components/layout";
import { Brandmark } from "@/components/layout/Navbar";
import { Button, Field, Input, useToast } from "@/components/ui";
import { passwordChecks, passwordStrength } from "@/lib/auth-utils";

function ResetPasswordForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { push } = useToast();
  const token = search.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const strength = useMemo(() => passwordStrength(password), [password]);
  const checks = useMemo(() => passwordChecks(password), [password]);

  function validate() {
    const next: Record<string, string> = {};
    if (!token) next.token = "A valid reset token is required";
    if (password.length < 8) next.password = "Password must be at least 8 characters";
    if (!/[A-Za-z]/.test(password)) next.password = "Password must contain a letter";
    if (!/[0-9]/.test(password)) next.password = "Password must contain a number";
    if (confirm !== password) next.confirm = "Passwords do not match";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrors({ form: json.message ?? "Unable to reset password" });
        push({ title: "Reset failed", description: json.message, tone: "error" });
        return;
      }
      setDone(true);
      push({
        title: "Password reset successful",
        description: "You can now log in with your new password.",
        tone: "success",
      });
      window.setTimeout(() => router.push("/login"), 1600);
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
        Reset your password
      </h1>
      <p className="mt-1.5 text-sm text-ink-500">
        Choose a strong new password for your EngineerPrep India account.
      </p>

      {done ? (
        <div className="mt-6 rounded-xl border border-success-500/25 bg-success-500/8 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-success-500">
            <CheckCircle2 className="size-4" /> Password updated
          </p>
          <p className="mt-2 text-xs text-ink-700">
            Redirecting you to the login page…
          </p>
        </div>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
          {!token && (
            <p className="rounded-lg border border-warning-500/25 bg-warning-500/10 px-3 py-2 text-xs font-semibold text-[#a56a00]">
              No reset token detected. Use the link from the forgot password
              page, or run the demo flow again.
            </p>
          )}

          <Field
            label="New password"
            htmlFor="new-password"
            error={errors.password}
            required
          >
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500"
                aria-hidden
              />
              <Input
                id="new-password"
                type={show ? "text" : "password"}
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
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>

          {password && (
            <div>
              <div className="flex items-center justify-between text-[0.7rem] font-semibold text-ink-500">
                <span>Password strength</span>
                <span>{strength.label}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-navy-900/8">
                <div
                  className={`h-full rounded-full ${
                    strength.score >= 85
                      ? "bg-success-500"
                      : strength.score >= 55
                        ? "bg-warning-500"
                        : "bg-error-500"
                  }`}
                  style={{ width: `${strength.score}%` }}
                />
              </div>
              <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                {checks.map((check) => (
                  <li
                    key={check.label}
                    className={`flex items-center gap-1.5 text-[0.7rem] ${
                      check.ok ? "text-success-500" : "text-ink-500"
                    }`}
                  >
                    <CheckCircle2 className="size-3" />
                    {check.label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Field
            label="Confirm new password"
            htmlFor="confirm-password"
            error={errors.confirm}
            required
          >
            <Input
              id="confirm-password"
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </Field>

          {errors.form && (
            <p className="rounded-lg border border-error-500/20 bg-error-500/10 px-3 py-2 text-xs font-semibold text-error-500">
              {errors.form}
            </p>
          )}

          <Button type="submit" block size="lg" loading={loading}>
            Reset Password
          </Button>
        </form>
      )}

      <p className="mt-6 text-sm text-ink-500">
        <Link href="/login" className="font-bold text-brand-600 hover:underline">
          Back to Login
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-white">
          <p className="text-sm text-ink-500">Loading…</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
