import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageSquare, MapPin, Send, HelpCircle, CheckCircle2, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Card, Badge, Button } from "@/components/ui";
import { siteConfig, absoluteUrl } from "@/lib/site-config";
import { BreadcrumbsJsonLd } from "@/components/seo/JsonLd";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact & Support | EngineerPrep India",
  description:
    "Get in touch with the EngineerPrep India team for academic inquiries, resource suggestions, platform support, and technical feedback.",
  alternates: {
    canonical: absoluteUrl("/contact"),
  },
  openGraph: {
    title: "Contact & Support | EngineerPrep India",
    description:
      "Reach out to the EngineerPrep India team for support, academic resource contributions, or general feedback.",
    url: absoluteUrl("/contact"),
  },
};

export default function ContactPage() {
  return (
    <>
      <BreadcrumbsJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Contact & Support", url: "/contact" },
        ]}
      />
      <PageHeader
        breadcrumb={[{ label: "Contact Us" }]}
        title="Contact & Support"
        subtitle="Have a question, feedback, or need academic resources added? We are here to help."
      />

      <div className="grid gap-8 lg:grid-cols-3 max-w-5xl">
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-5">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-500 mb-3">
              <Mail className="size-5" />
            </span>
            <h3 className="text-sm font-bold text-ink-900">Email Support</h3>
            <p className="mt-1 text-xs text-ink-500">
              For general queries, academic corrections, or partnership requests:
            </p>
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className="mt-3 inline-block font-mono text-xs font-bold text-brand-600 hover:underline"
            >
              {siteConfig.contact.email}
            </a>
          </Card>

          <Card className="p-5">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-500 mb-3">
              <ExternalLink className="size-5" />
            </span>
            <h3 className="text-sm font-bold text-ink-900">Open Source &amp; Code</h3>
            <p className="mt-1 text-xs text-ink-500">
              Report bugs, suggest platform features, or review development progress:
            </p>
            <a
              href="https://github.com/arunkumarar45/engineerprep-india-platform-development"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block font-mono text-xs font-bold text-brand-600 hover:underline"
            >
              GitHub Repository →
            </a>
          </Card>

          <Card className="p-5 bg-surface-elevated">
            <div className="flex items-center gap-2 text-ink-900 font-bold text-xs mb-1">
              <CheckCircle2 className="size-4 text-brand-500" /> Response Time
            </div>
            <p className="text-[0.72rem] text-ink-500 leading-relaxed">
              We review submissions and academic verification tickets within 24 to 48 business hours.
            </p>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="p-6 sm:p-8">
            <h2 className="text-base font-bold text-ink-900 mb-1">Send Us a Message</h2>
            <p className="text-xs text-ink-500 mb-6">
              Fill out the form below and our team will get back to you shortly.
            </p>

            <ContactForm />
          </Card>
        </div>
      </div>
    </>
  );
}

