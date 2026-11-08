"use client";

import { useState } from "react";
import { CheckCircle2, Upload } from "lucide-react";
import {
  Button,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
  useToast,
} from "@/components/ui";
import type { JobRow } from "./JobBoard";

const BRANCHES = [
  "Computer Science & Engineering",
  "Information Science & Engineering",
  "Electronics & Communication",
  "Electrical & Electronics",
  "Mechanical Engineering",
  "Civil Engineering",
];

export function ApplyDialog({
  job,
  onClose,
  onApplied,
}: {
  job: JobRow;
  onClose: () => void;
  onApplied: () => void;
}) {
  const { push } = useToast();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    college: "",
    branch: "",
    graduationYear: "",
    resumeName: "",
    portfolioUrl: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!form.fullName.trim()) next.fullName = "Full name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Enter a valid email address";
    if (form.phone.replace(/\D/g, "").length < 10)
      next.phone = "Enter a valid phone number";
    if (!form.college.trim()) next.college = "College name is required";
    if (!form.branch) next.branch = "Select your branch";
    if (!form.graduationYear) next.graduationYear = "Select graduation year";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/jobs/apply/${job.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          college: form.college,
          branch: form.branch,
          graduationYear: Number(form.graduationYear),
          resumeUrl: form.resumeName
            ? "/demo-files/sample-resume.pdf"
            : undefined,
          portfolioUrl: form.portfolioUrl || undefined,
          notes: form.notes || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        push({
          title: "Application failed",
          description: json.message,
          tone: "error",
        });
        return;
      }
      setDone(true);
      push({
        title: "Application submitted",
        description: `${job.title} · ${job.companyName}`,
        tone: "success",
      });
      onApplied();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={done ? "Application submitted" : `Apply · ${job.title}`}
      description={
        done
          ? "Demo mode confirmation"
          : `${job.companyName} · ${job.location}`
      }
      size="lg"
    >
      {done ? (
        <div className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-success-500/10 text-success-500">
            <CheckCircle2 className="size-6" />
          </span>
          <h3 className="mt-3 text-base font-bold text-ink-900">
            Your application has been recorded
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">
            This is a demo environment. No application is sent to the employer —
            the record is stored against your demo account and appears in{" "}
            <span className="font-semibold text-ink-900">My Applications</span>.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button onClick={onClose}>Close</Button>
            <a
              href="/jobs/applications"
              className="inline-flex h-9.5 items-center rounded-lg border border-line px-4 text-sm font-bold text-ink-900 hover:border-brand-300 hover:text-brand-600"
            >
              View applications
            </a>
          </div>
        </div>
      ) : (
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit} noValidate>
          <Field label="Full name" htmlFor="apply-name" error={errors.fullName} required>
            <Input
              id="apply-name"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
            />
          </Field>
          <Field label="Email" htmlFor="apply-email" error={errors.email} required>
            <Input
              id="apply-email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </Field>
          <Field label="Phone" htmlFor="apply-phone" error={errors.phone} required>
            <Input
              id="apply-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </Field>
          <Field label="College" htmlFor="apply-college" error={errors.college} required>
            <Input
              id="apply-college"
              value={form.college}
              onChange={(e) => update("college", e.target.value)}
            />
          </Field>
          <Field label="Branch" htmlFor="apply-branch" error={errors.branch} required>
            <Select
              id="apply-branch"
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
          <Field
            label="Graduation year"
            htmlFor="apply-year"
            error={errors.graduationYear}
            required
          >
            <Select
              id="apply-year"
              value={form.graduationYear}
              onChange={(e) => update("graduationYear", e.target.value)}
            >
              <option value="">Select year</option>
              {[2025, 2026, 2027, 2028].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Resume" htmlFor="apply-resume" hint="PDF · max 5 MB">
            <label
              htmlFor="apply-resume"
              className="flex h-9.5 cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3 text-xs font-semibold text-ink-700 hover:border-brand-300"
            >
              <Upload className="size-3.5" />
              {form.resumeName || "Choose file"}
            </label>
            <input
              id="apply-resume"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) =>
                update("resumeName", e.target.files?.[0]?.name ?? "")
              }
            />
          </Field>
          <Field label="Portfolio / GitHub URL" htmlFor="apply-portfolio">
            <Input
              id="apply-portfolio"
              placeholder="https://github.com/you"
              value={form.portfolioUrl}
              onChange={(e) => update("portfolioUrl", e.target.value)}
            />
          </Field>
          <Field label="Notes" htmlFor="apply-notes" className="sm:col-span-2">
            <Textarea
              id="apply-notes"
              placeholder="Anything you'd like the recruiter to know"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </Field>
          <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
            <p className="text-[0.7rem] text-ink-500">
              Demo mode — no data leaves this sandbox.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Submit Application
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
