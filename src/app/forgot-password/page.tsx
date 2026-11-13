"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { AuthLayout } from "@/components/layout";
import { Brandmark } from "@/components/layout/Navbar";
import { Button, Field, Input } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    email: string;
    resetToken?: string;
    note?: string;
  } | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      setResult(json.data ?? { email });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="mb-7">
        <Brandmark />
      </div>
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-500 hover:text-brand-600"
      >
        <ArrowLeft className="size-3.5" /> Back to Login
      </Link>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ink-900">
        Forgot your password?
      </h1>
      <p className="mt-1.5 text-sm text-ink-500">
        Don&apos;t worry. Enter your registered email address and we&apos;ll help
        you reset your password.
      </p>

      {result ? (
        <div className="mt-6 rounded-xl border border-success-500/25 bg-success-500/8 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-success-500">
            <CheckCircle2 className="size-4" /> Check your inbox
          </p>
          <p className="mt-2 text-xs leading-relaxed text-ink-700">
            If an account exists for{" "}
            <span className="font-bold">{result.email}</span>, a password reset
            link has been sent. Please check your inbox and spam folder.
          </p>
          <p className="mt-2 text-xs text-ink-500">
            The link expires in 1 hour. If you don&apos;t receive it, try again
            or contact support.
          </p>
        </div>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
          <Field label="Email address" htmlFor="forgot-email" error={error} required>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500"
                aria-hidden
              />
              <Input
                id="forgot-email"
                type="email"
                className="pl-9"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </Field>
          <Button type="submit" block size="lg" loading={loading}>
            Send Reset Link
          </Button>
        </form>
      )}

      <p className="mt-6 text-sm text-ink-500">
        Remembered your password?{" "}
        <Link href="/login" className="font-bold text-brand-600 hover:underline">
          Login
        </Link>
      </p>
    </AuthLayout>
  );
}
