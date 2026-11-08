"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, Save, User } from "lucide-react";
import { Button, Card, Field, Input, Select, useToast } from "@/components/ui";
import type { SessionUser } from "@/lib/auth";

export function ProfileEditor({
  user,
  branches,
  semesters,
}: {
  user: SessionUser;
  branches: Array<{ id: string; code: string; name: string }>;
  semesters: Array<{ id: string; number: number; label: string }>;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [form, setForm] = useState({
    fullName: user.fullName,
    email: user.email,
    phone: "",
    collegeName: user.collegeName ?? "",
    branchId: user.branchId ?? "",
    semesterId: user.semesterId ?? "",
    graduationYear: String(user.graduationYear ?? ""),
  });
  const [saving, setSaving] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/v1/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone || undefined,
          collegeName: form.collegeName || undefined,
          branchId: form.branchId || undefined,
          semesterId: form.semesterId || undefined,
          graduationYear: form.graduationYear
            ? Number(form.graduationYear)
            : undefined,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        push({ title: "Profile updated", description: json.message, tone: "success" });
        router.refresh();
      } else {
        push({
          title: "Update failed",
          description: json.message,
          tone: "error",
        });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
      <Card className="p-5">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={save}>
          <Field label="Full name" htmlFor="profile-name" required>
            <div className="relative">
              <User
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500"
                aria-hidden
              />
              <Input
                id="profile-name"
                className="pl-9"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
              />
            </div>
          </Field>
          <Field label="Email address" htmlFor="profile-email">
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500"
                aria-hidden
              />
              <Input id="profile-email" className="pl-9" value={form.email} disabled />
            </div>
          </Field>
          <Field label="Phone number" htmlFor="profile-phone">
            <div className="relative">
              <Phone
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500"
                aria-hidden
              />
              <Input
                id="profile-phone"
                className="pl-9"
                placeholder="+91 90000 00000"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>
          </Field>
          <Field label="College" htmlFor="profile-college">
            <Input
              id="profile-college"
              value={form.collegeName}
              onChange={(e) => update("collegeName", e.target.value)}
            />
          </Field>
          <Field label="Branch" htmlFor="profile-branch">
            <Select
              id="profile-branch"
              value={form.branchId}
              onChange={(e) => update("branchId", e.target.value)}
            >
              <option value="">Not set</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.code} — {branch.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Semester" htmlFor="profile-semester">
            <Select
              id="profile-semester"
              value={form.semesterId}
              onChange={(e) => update("semesterId", e.target.value)}
            >
              <option value="">Not set</option>
              {semesters.map((semester) => (
                <option key={semester.id} value={semester.id}>
                  Semester {semester.number}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Graduation year" htmlFor="profile-year">
            <Select
              id="profile-year"
              value={form.graduationYear}
              onChange={(e) => update("graduationYear", e.target.value)}
            >
              <option value="">Not set</option>
              {[2025, 2026, 2027, 2028, 2029, 2030].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-2 flex justify-end border-t border-line pt-3">
            <Button type="submit" loading={saving}>
              <Save className="size-4" /> Save changes
            </Button>
          </div>
        </form>
      </Card>

      <aside className="space-y-4">
        <Card className="p-5 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-navy-900 text-xl font-extrabold text-white">
            {user.fullName
              .split(" ")
              .slice(0, 2)
              .map((part) => part[0])
              .join("")}
          </span>
          <p className="mt-3 text-sm font-bold text-ink-900">{user.fullName}</p>
          <p className="text-[0.7rem] text-ink-500">{user.email}</p>
          <p className="mt-2 inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-[0.65rem] font-bold text-brand-600">
            {user.role === "ADMIN" ? "Administrator" : "Student account"}
          </p>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-bold text-ink-900">Account status</h2>
          <dl className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <dt className="text-ink-500">Email verified</dt>
              <dd className="font-bold text-ink-900">
                {user.emailVerified ? "Yes" : "Pending"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Member since</dt>
              <dd className="font-bold text-ink-900">2026</dd>
            </div>
          </dl>
        </Card>
      </aside>
    </div>
  );
}
