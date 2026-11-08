"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import { AuthLayout } from "@/components/layout";
import { Brandmark } from "@/components/layout/Navbar";
import { Button, Field, Input, Select, useToast } from "@/components/ui";
import { passwordStrength } from "@/lib/auth-utils";

const BRANCHES = [
  "Computer Science & Engineering",
  "Information Science & Engineering",
  "Electronics & Communication",
  "Electrical & Electronics",
  "Mechanical Engineering",
  "Civil Engineering",
];

const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];

export default function RegisterPage() {
  const router = useRouter();
  const { push } = useToast();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    collegeName: "",
    branch: "",
    semester: "",
    graduationYear: "",
  });
  const [show, setShow] = useState(false);
  const [accept, setAccept] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const strength = useMemo(
    () => passwordStrength(form.password),
    [form.password],
  );

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!form.fullName.trim()) next.fullName = "Full name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Enter a valid email address";
    if (form.phone && form.phone.replace(/\D/g, "").length < 10)
      next.phone = "Enter a valid 10-digit phone number";
    if (form.password.length < 8)
      next.password = "Password must be at least 8 characters";
    if (!/[A-Za-z]/.test(form.password))
      next.password = "Password must contain a letter";
    if (!/[0-9]/.test(form.password))
      next.password = "Password must contain a number";
    if (form.confirmPassword !== form.password)
      next.confirmPassword = "Passwords do not match";
    if (!form.collegeName.trim()) next.collegeName = "College name is required";
    if (!form.branch) next.branch = "Select your branch";
    if (!form.semester) next.semester = "Select your semester";
    if (!form.graduationYear) next.graduationYear = "Select your graduation year";
    if (!accept) next.accept = "You must accept the terms and conditions";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          password: form.password,
          collegeName: form.collegeName,
          graduationYear: Number(form.graduationYear),
          acceptTerms: accept,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrors({ form: json.message ?? "Unable to create account" });
        push({ title: "Registration failed", description: json.message, tone: "error" });
        return;
      }
      push({
        title: "Account created",
        description: "Welcome to EngineerPrep India. Redirecting to your dashboard.",
        tone: "success",
      });
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrors({ form: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  const strengthTone =
    strength.score >= 85
      ? "bg-success-500"
      : strength.score >= 55
        ? "bg-warning-500"
        : "bg-error-500";

  return (
    <AuthLayout>
      <div className="mb-6">
        <Brandmark />
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">
        Create your account
      </h1>
      <p className="mt-1.5 text-sm text-ink-500">
        Join 20K+ engineering students preparing with EngineerPrep India.
      </p>

      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit} noValidate>
        <Field label="Full name" htmlFor="fullName" error={errors.fullName} required>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500" aria-hidden />
            <Input
              id="fullName"
              className="pl-9"
              placeholder="Arun Kumar"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
            />
          </div>
        </Field>

        <Field label="Email address" htmlFor="reg-email" error={errors.email} required>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500" aria-hidden />
            <Input
              id="reg-email"
              type="email"
              className="pl-9"
              placeholder="you@college.edu"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>
        </Field>

        <Field label="Phone number" htmlFor="phone" error={errors.phone}>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500" aria-hidden />
            <Input
              id="phone"
              type="tel"
              className="pl-9"
              placeholder="+91 90000 00000"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </div>
        </Field>

        <Field label="College name" htmlFor="college" error={errors.collegeName} required>
          <Input
            id="college"
            placeholder="Government Engineering College"
            value={form.collegeName}
            onChange={(e) => update("collegeName", e.target.value)}
          />
        </Field>

        <Field label="Engineering branch" htmlFor="branch" error={errors.branch} required>
          <Select
            id="branch"
            value={form.branch}
            onChange={(e) => update("branch", e.target.value)}
          >
            <option value="">Select branch</option>
            {BRANCHES.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Current semester" htmlFor="semester" error={errors.semester} required>
          <Select
            id="semester"
            value={form.semester}
            onChange={(e) => update("semester", e.target.value)}
          >
            <option value="">Select semester</option>
            {SEMESTERS.map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Graduation year"
          htmlFor="gradYear"
          error={errors.graduationYear}
          required
        >
          <Select
            id="gradYear"
            value={form.graduationYear}
            onChange={(e) => update("graduationYear", e.target.value)}
          >
            <option value="">Select year</option>
            {[2026, 2027, 2028, 2029, 2030].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Password" htmlFor="reg-password" error={errors.password} required>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500" aria-hidden />
            <Input
              id="reg-password"
              type={show ? "text" : "password"}
              className="px-9"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
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

        <Field
          label="Confirm password"
          htmlFor="confirm"
          error={errors.confirmPassword}
          required
        >
          <Input
            id="confirm"
            type={show ? "text" : "password"}
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
          />
        </Field>

        {form.password && (
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between text-[0.7rem] font-semibold text-ink-500">
              <span>Password strength</span>
              <span>{strength.label}</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-navy-900/8">
              <div
                className={`h-full rounded-full transition-all ${strengthTone}`}
                style={{ width: `${strength.score}%` }}
              />
            </div>
          </div>
        )}

        <div className="sm:col-span-2">
          <label className="flex cursor-pointer items-start gap-2 text-xs text-ink-700">
            <input
              type="checkbox"
              checked={accept}
              onChange={(e) => setAccept(e.target.checked)}
              className="mt-0.5 size-4 rounded border-line accent-brand-500"
            />
            <span>
              I accept the terms and conditions and agree that this is a demo
              environment.
            </span>
          </label>
          {errors.accept && (
            <p className="mt-1 text-[0.7rem] font-semibold text-error-500">
              {errors.accept}
            </p>
          )}
        </div>

        {errors.form && (
          <p className="sm:col-span-2 rounded-lg border border-error-500/20 bg-error-500/10 px-3 py-2 text-xs font-semibold text-error-500">
            {errors.form}
          </p>
        )}

        <div className="sm:col-span-2">
          <Button type="submit" block size="lg" loading={loading}>
            Register
          </Button>
        </div>
      </form>

      <p className="mt-5 text-sm text-ink-500">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-brand-600 hover:underline">
          Login
        </Link>
      </p>
    </AuthLayout>
  );
}
