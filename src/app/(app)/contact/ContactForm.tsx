"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui";

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const res = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit your message. Please try again.");
      }

      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Something went wrong. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-8 text-center space-y-4">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="size-6" />
        </span>
        <h3 className="text-base font-bold text-ink-900">Message Delivered Successfully!</h3>
        <p className="text-xs text-ink-600 max-w-md mx-auto leading-relaxed">
          Thank you for reaching out to the EngineerPrep India team. Our academic and support coordinators will review your inquiry and respond within 24 to 48 business hours.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="mt-2 text-xs"
          onClick={() => setStatus("idle")}
        >
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {status === "error" && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
          <AlertCircle className="size-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-ink-700 mb-1">
            Your Name <span className="text-brand-600">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Arun Kumar"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-700 mb-1">
            Email Address <span className="text-brand-600">*</span>
          </label>
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-ink-700 mb-1">
          Subject <span className="text-brand-600">*</span>
        </label>
        <input
          type="text"
          required
          placeholder="e.g. Request for VTU 2022 Scheme Lab Manual / Question Paper"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-ink-700 mb-1">
          Message <span className="text-brand-600">*</span>
        </label>
        <textarea
          rows={5}
          required
          placeholder="Please describe your question, resource request, or feedback in detail..."
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-y"
        />
      </div>

      <Button
        type="submit"
        size="md"
        disabled={loading}
        className="w-full sm:w-auto text-xs font-bold"
      >
        <Send className="size-3.5" />
        <span>{loading ? "Sending Message..." : "Submit Message"}</span>
      </Button>
    </form>
  );
}
